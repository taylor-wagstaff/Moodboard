document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search')
  const imageNumber = document.getElementById('imageNumber')
  const form = document.querySelector('.form')

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

    const resultsContainer = document.querySelector('.results-container')
    resultsContainer.innerHTML = ''
  })

  document
    .getElementById('capture-button')
    .addEventListener('click', function () {
      const container = document.querySelector('.results-container')

      // Ensure images are fully loaded
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
    const url = `http://api.are.na/v2/channels/${channelName}/contents?direction=desc&sort=position&page=0&per=${imageNumberValue}`
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`)
      }

      const data = await response.json()
      console.log(data)

      const resultsContainer = document.querySelector('.results-container')
      resultsContainer.innerHTML = ''

      data.contents.forEach((item) => {
        if (item.image && item.image.original && item.image.original.url) {
          const imgUrl = item.image.original.url

          const imgElement = document.createElement('img')
          imgElement.src = imgUrl
          imgElement.alt = item.title || 'Image'
          imgElement.classList.add('result-image')
          imgElement.id = 'image-result'

          resultsContainer.appendChild(imgElement)
        }
      })
    } catch (error) {
      console.error(error.message)
    }
  }

  function captureScreenshot(container) {
    html2canvas(container, {
      logging: true,
      letterRendering: 1,
      allowTaint: false,
      useCORS: true,
    }).then((canvas) => {
      let link = document.createElement('a')
      link.download = 'screenshot.png'
      link.href = canvas.toDataURL()
      link.click()
    })
  }
})
