import { PageHeader } from '../components/PageHeader'

// 階段 2 的佔位頁；後續階段逐頁換成真正的內容。
export function PlaceholderPage({ title }: { title: string }) {
  return <PageHeader title={title} />
}
