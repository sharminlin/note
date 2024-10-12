import { Metadata } from "next";

interface CommentRouteParams {
  id: string
}

// export const metadata: Metadata = {
//   title: "Comment Detail",
// }

export async function generateMetadata(
  { params }: Readonly<{ params: CommentRouteParams }>
): Promise<Metadata> {
  return {
    title: `Comment Detail ${params.id}`
  }
}

export default function CommentDetail(
  { params }: Readonly<{ params: CommentRouteParams }>
) {
  console.log(params)
  return <div>{ params.id }</div>
}