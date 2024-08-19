document.addEventListener('DOMContentLoaded', () => {
  let draggedImage = null
  let offsetX = 0
  let offsetY = 0
  let isDragging = false

  const searchInput = document.getElementById('search')
  const imageNumber = document.getElementById('imageNumber')
  const form = document.querySelector('.form')
  const resultsContainer = document.querySelector('.results-container')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const channelName = searchInput.value.trim()
    const imageNumberValue = imageNumber.value.trim()

    if (channelName && imageNumberValue) {
      await getContents(channelName, imageNumberValue)
    }
  })

  const clearButton = document.getElementById('clear')
  clearButton.addEventListener('click', () => {
    searchInput.value = ''
    imageNumber.value = ''

    resultsContainer.innerHTML = ''
  })

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
      console.log(data)

      resultsContainer.innerHTML = ''

      data.contents.forEach((item) => {
        if (item.image && item.image.original && item.image.original.url) {
          const imgUrl = item.image.original.url

          const imgElement = document.createElement('img')
          imgElement.src = imgUrl
          imgElement.alt = item.title || 'Image'
          imgElement.classList.add('result-image')

          imgElement.style.position = 'relative' // Keep images in the flow initially

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
              // of container size
              const containerRect = resultsContainer.getBoundingClientRect()
              const imgWidth = draggedImage.offsetWidth
              const imgHeight = draggedImage.offsetHeight

              let newX = e.pageX - offsetX
              let newY = e.pageY - offsetY

              //chatgpt for this
              if (newX < containerRect.left) newX = containerRect.left
              if (newX + imgWidth > containerRect.right)
                newX = containerRect.right - imgWidth
              if (newY < containerRect.top) newY = containerRect.top
              if (newY + imgHeight > containerRect.bottom)
                newY = containerRect.bottom - imgHeight

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

  // save the moodboard to png
  function captureScreenshot(container) {
    html2canvas(container, {
      logging: true,
      letterRendering: 1,
      allowTaint: false,
      useCORS: true,
      scale: 3,
    }).then((canvas) => {
      let link = document.createElement('a')
      link.download = 'moodboard.png'
      link.href = canvas.toDataURL()
      link.click()
    })
  }
})
