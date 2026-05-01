export function contractExpiringTemplate(input: {
  contractCode: string;
  contractTitle: string;
  partnerName: string;
  endDate: Date;
  reminderThresholdDays?: number | null;
}) {
  const thresholdText = input.reminderThresholdDays ? `${input.reminderThresholdDays} day(s)` : "soon";
  const subject = `[Contract Reminder] ${input.contractCode} expires in ${thresholdText}`;
  const text = `Contract ${input.contractTitle} (${input.contractCode}) with ${input.partnerName} is expiring on ${input.endDate.toISOString().slice(0, 10)} (reminder: ${thresholdText} before end date).`;
  const html = `
    <p>Hello,</p>
    <p>Contract <strong>${input.contractTitle}</strong> (${input.contractCode}) with <strong>${input.partnerName}</strong> is expiring on <strong>${input.endDate.toISOString().slice(0, 10)}</strong>.</p>
    <p>This reminder is sent at the <strong>${thresholdText}</strong> milestone.</p>
    <p>Please review renewal options in the Contract Management System.</p>
  `;

  return { subject, text, html };
}
