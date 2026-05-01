export function contractExpiredTemplate(input: {
  contractCode: string;
  contractTitle: string;
  partnerName: string;
  endDate: Date;
}) {
  const subject = `[Contract Alert] ${input.contractCode} has expired`;
  const text = `Contract ${input.contractTitle} (${input.contractCode}) with ${input.partnerName} expired on ${input.endDate.toISOString().slice(0, 10)}.`;
  const html = `
    <p>Hello,</p>
    <p>Contract <strong>${input.contractTitle}</strong> (${input.contractCode}) with <strong>${input.partnerName}</strong> expired on <strong>${input.endDate.toISOString().slice(0, 10)}</strong>.</p>
    <p>Please review contract status and next actions.</p>
  `;

  return { subject, text, html };
}
