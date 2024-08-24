document.addEventListener('DOMContentLoaded', () => {
  let draggedImage = null
  let offsetX = 0
  let offsetY = 0
  let isDragging = false

  const searchInput = document.getElementById('search')
  const imageNumber = document.getElementById('imageNumber')
  const form = document.querySelector('.form')
  const resultsContainer = document.querySelector('.results-container')
  const loader = document.getElementById('loader')

  const helpButton = document.getElementById('help')
  const modal = document.getElementById('helpModal')
  const closeButton = document.querySelector('.close')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const channelName = searchInput.value.trim()
    const imageNumberValue = imageNumber.value.trim()

    if (channelName && imageNumberValue) {
      loader.style.display = 'block' // Show loader

      // Introduce a 2-second delay before loading the images
      setTimeout(async () => {
        await getContents(channelName, imageNumberValue)
        loader.style.display = 'none' // Hide loader after images load
      }, 2000) // 2-second delay
    }
  })

  const clearButton = document.getElementById('clear')
  clearButton.addEventListener('click', () => {
    searchInput.value = ''
    imageNumber.value = ''
    resultsContainer.innerHTML = ''
  })

  // Capture screenshot functionality
  document
    .getElementById('capture-button')
    .addEventListener('click', function () {
      const container = resultsContainer

      const images = container.getElementsByTagName('img')
      const totalImages = images.length
      let imagesLoaded = 0

      for (let img of images) {
        if (img.complete) {
          imagesLoaded++
        } else {
          img.addEventListener('load', () => {
            imagesLoaded++
            if (imagesLoaded === totalImages) {
              captureScreenshot(container)
            }
          })
          img.addEventListener('error', () => {
            imagesLoaded++
            if (imagesLoaded === totalImages) {
              captureScreenshot(container)
            }
          })
        }
      }

      if (imagesLoaded === totalImages) {
        captureScreenshot(container)
      }
    })

  async function getContents(channelName, imageNumberValue) {
    const url = `https://api.are.na/v2/channels/${channelName}/contents?direction=desc&sort=position&page=0&per=${imageNumberValue}`
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
      }

      const data = await response.json()
      resultsContainer.innerHTML = ''

      data.contents.forEach((item) => {
        if (item.image && item.image.original && item.image.original.url) {
          const imgUrl = item.image.original.url

          const imgElement = document.createElement('img')
          imgElement.src = imgUrl
          imgElement.alt = item.title || 'Image'
          imgElement.classList.add('result-image')
          imgElement.style.position = 'relative'

          imgElement.addEventListener('mouseenter', () => {
            imgElement.style.opacity = '0.5'
            imgElement.style.transition = 'opacity 0.25s ease-in-out'
          })

          imgElement.addEventListener('mouseleave', () => {
            imgElement.style.opacity = '1'
          })

          imgElement.addEventListener('click', (e) => {
            if (!isDragging) {
              isDragging = true
              draggedImage = imgElement
              const rect = draggedImage.getBoundingClientRect()
              offsetX = e.clientX - rect.left
              offsetY = e.clientY - rect.top
              draggedImage.style.position = 'absolute'
              draggedImage.style.zIndex = 1000
              draggedImage.style.cursor = 'move'

              document.addEventListener('mousemove', followMouse)
            } else {
              document.removeEventListener('mousemove', followMouse)
              isDragging = false
              draggedImage.style.zIndex = ''
              draggedImage.style.opacity = '1'
              draggedImage.style.cursor = 'pointer'
              draggedImage = null
            }
          })

          function followMouse(e) {
            if (draggedImage) {
              const containerRect = resultsContainer.getBoundingClientRect()
              const imgWidth = draggedImage.offsetWidth
              const imgHeight = draggedImage.offsetHeight

              let newX =
                e.clientX -
                containerRect.left -
                offsetX +
                resultsContainer.scrollLeft
              let newY =
                e.clientY -
                containerRect.top -
                offsetY +
                resultsContainer.scrollTop

              if (newX < 0) newX = 0
              if (newX + imgWidth > resultsContainer.scrollWidth)
                newX = resultsContainer.scrollWidth - imgWidth
              if (newY < 0) newY = 0
              if (newY + imgHeight > resultsContainer.scrollHeight)
                newY = resultsContainer.scrollHeight - imgHeight

              draggedImage.style.left = newX + 'px'
              draggedImage.style.top = newY + 'px'
            }
          }

          resultsContainer.appendChild(imgElement)
        }
      })
    } catch (error) {
      console.error(error.message)
    }
  }

  function updateContainerSize(container) {
    const images = container.querySelectorAll('img')
    let maxWidth = 0
    let maxHeight = 0

    images.forEach((img) => {
      const rect = img.getBoundingClientRect()
      maxWidth = Math.max(
        maxWidth,
        rect.right - container.getBoundingClientRect().left
      )
      maxHeight = Math.max(
        maxHeight,
        rect.bottom - container.getBoundingClientRect().top
      )
    })

    container.style.width = `${maxWidth}px`
    container.style.height = `${maxHeight}px`
  }

  function initDrag() {
    const images = document.querySelectorAll('.results-container img')
    images.forEach((img) => {
      img.addEventListener('mousedown', function (event) {
        const offsetX = event.clientX - img.getBoundingClientRect().left
        const offsetY = event.clientY - img.getBoundingClientRect().top

        function onMouseMove(event) {
          img.style.left = `${event.clientX - offsetX}px`
          img.style.top = `${event.clientY - offsetY}px`

          // Update container size
          const container = document.querySelector('.results-container')
          updateContainerSize(container)
        }

        function onMouseUp() {
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      })
    })
  }

  initDrag()

  function captureScreenshot(container) {
    html2canvas(container, {
      logging: true,
      letterRendering: 1,
      allowTaint: false,
      useCORS: true,
      scale: 2,
      scrollX: 0,
      scrollY: 0,
    }).then((canvas) => {
      let link = document.createElement('a')
      link.download = 'moodboard.png'
      link.href = canvas.toDataURL()
      link.click()
    })
  }

  // Modal functionality
  helpButton.addEventListener('click', () => {
    modal.style.display = 'block'
  })

  closeButton.addEventListener('click', () => {
    modal.style.display = 'none'
  })

  window.addEventListener('click', (event) => {
    if (event.target == modal) {
      modal.style.display = 'none'
    }
  })
})
