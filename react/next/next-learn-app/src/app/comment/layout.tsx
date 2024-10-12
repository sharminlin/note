export default function CommentLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-center">
      {children}
    </div>
  )
}