import Image from 'next/image'

export function Footer() {
  return (
    <footer className="flex justify-between items-center p-4 bg-red-900 text-white mt-auto">
      <div>PUP Hygears Batch 2023-2024</div>
      <Image
        src="/logo.svg"
        alt="PUP Logo"
        width={40}
        height={40}
      />
    </footer>
  )
}