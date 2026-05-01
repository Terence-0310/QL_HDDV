export function contractRenewedTemplate(input: {
  previousCode: string;
  renewedCode: string;
  renewedTitle: string;
  startDate: Date;
  endDate: Date;
}) {
  const subject = `[Contract Renewal] ${input.renewedCode} created from ${input.previousCode}`;
  const text = `Renewed contract ${input.renewedTitle} (${input.renewedCode}) is active from ${input.startDate.toISOString().slice(0, 10)} to ${input.endDate.toISOString().slice(0, 10)}.`;
  const html = `
    <p>Hello,</p>
    <p>A renewed contract <strong>${input.renewedTitle}</strong> (${input.renewedCode}) was created from <strong>${input.previousCode}</strong>.</p>
    <p>Renewal period: <strong>${input.startDate.toISOString().slice(0, 10)}</strong> to <strong>${input.endDate.toISOString().slice(0, 10)}</strong>.</p>
  `;

  return { subject, text, html };
}
