interface SeoProps {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function generateSeo({
  title = 'Xpay',
  description = 'Xpay is a payment platform that allows you to send and receive payments in a secure and efficient way.',
  image = '/logo512.png',
  url = 'https://xpay.vercel.app',
}: SeoProps = {}) {
  const finalTitle = title === 'Xpay' ? title : `${title} | Xpay`

  return [
    { title: finalTitle },
    { name: 'description', content: description },
    { property: 'og:title', content: finalTitle },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: url },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: finalTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ]
}