import { ContractDetailView } from "@/components/admin/contract-detail-view";

export default async function ContractDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <ContractDetailView contractId={params.id} />;
}
