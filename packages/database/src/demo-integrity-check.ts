import { db } from './client.js';

type CheckResult = {
  name: string;
  reference: string;
  passed: boolean;
  details: string[];
};

async function main() {
  const results: CheckResult[] = [];

  const community = await db.community.findFirst({
    where: { OR: [{ slug: 'green-valley-township' }, { code: 'GVH' }] },
  });

  if (!community) {
    throw new Error('Demo community green-valley-township/GVH was not found.');
  }

  const waterTicket = await db.ticket.findFirst({
    where: { communityId: community.id, ticketNumber: 'TKT-2026-3012' },
    include: {
      unit: true,
      workOrderLinks: {
        include: { workOrder: { include: { tasks: true, materialRequirements: true } } },
      },
      feedback: true,
    },
  });
  const waterWorkOrder = waterTicket?.workOrderLinks[0]?.workOrder;
  results.push({
    name: 'Water Leak Story',
    reference: 'TKT-2026-3012 / WO-2026-3012',
    passed:
      waterTicket?.currentState === 'RESOLVED' &&
      waterTicket.unit?.unitNumber === 'A-301' &&
      waterWorkOrder?.currentState === 'COMPLETED' &&
      waterWorkOrder.tasks.length >= 4 &&
      waterWorkOrder.materialRequirements.length >= 1 &&
      waterTicket.feedback?.rating === 5,
    details: [
      `ticket=${waterTicket?.ticketNumber ?? 'missing'}`,
      `unit=${waterTicket?.unit?.unitNumber ?? 'missing'}`,
      `workOrder=${waterWorkOrder?.workOrderNumber ?? 'missing'}`,
      `tasks=${waterWorkOrder?.tasks.length ?? 0}`,
      `materials=${waterWorkOrder?.materialRequirements.length ?? 0}`,
      `feedback=${waterTicket?.feedback?.rating ?? 'missing'}`,
    ],
  });

  const liftAsset = await db.asset.findFirst({
    where: { assetCode: 'AST-2026-000004' },
    include: {
      downtimes: true,
      serviceRecords: true,
      workOrderLinks: { include: { workOrder: true } },
    },
  });
  const liftDowntime = liftAsset?.downtimes.find((event: any) => event.durationMinutes === 175);
  const liftService = liftAsset?.serviceRecords.find(
    (record: any) => record.workOrderId === liftDowntime?.sourceWorkOrderId,
  );
  const liftWorkOrder = liftAsset?.workOrderLinks.find(
    (link: any) => link.workOrder.workOrderNumber === 'WO-DEMO-LIFT-01',
  )?.workOrder;
  results.push({
    name: 'Lift Breakdown Story',
    reference: 'AST-2026-000004 / WO-DEMO-LIFT-01',
    passed:
      liftAsset?.operationalStatus === 'OPERATIONAL' &&
      liftDowntime?.endedAt != null &&
      liftWorkOrder?.currentState === 'COMPLETED' &&
      liftService?.serviceType === 'CORRECTIVE',
    details: [
      `asset=${liftAsset?.assetCode ?? 'missing'}`,
      `assetStatus=${liftAsset?.operationalStatus ?? 'missing'}`,
      `downtimeMinutes=${liftDowntime?.durationMinutes ?? 'missing'}`,
      `workOrder=${liftWorkOrder?.workOrderNumber ?? 'missing'}`,
      `serviceRecord=${liftService?.id ?? 'missing'}`,
    ],
  });

  const procurement = await db.purchaseRequisition.findFirst({
    where: { requisitionNumber: 'PR-2026-000001' },
    include: {
      lines: {
        include: {
          rfqLines: { include: { rfq: { include: { quotations: true, sourcingAwards: true } } } },
          poLines: {
            include: {
              purchaseOrder: {
                include: {
                  goodsReceiptNotes: true,
                  supplierInvoices: {
                    include: { paymentAllocations: { include: { vendorPayment: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  const procurementPo = procurement?.lines[0]?.poLines[0]?.purchaseOrder;
  const procurementInvoice = procurementPo?.supplierInvoices[0];
  const procurementPayment = procurementInvoice?.paymentAllocations[0]?.vendorPayment;
  results.push({
    name: 'Procurement Story',
    reference: 'PR-2026-000001 / RFQ-2026-000001 / PO-2026-000001 / GRN-2026-000001',
    passed:
      procurement?.status === 'APPROVED' &&
      procurement.lines.some((line: any) => line.rfqLines.length > 0) &&
      procurementPo?.status === 'FULLY_RECEIVED' &&
      procurementPo.goodsReceiptNotes.some((grn: any) => grn.status === 'POSTED') &&
      procurementInvoice?.status === 'PAID' &&
      procurementPayment?.status === 'SUCCESS',
    details: [
      `pr=${procurement?.requisitionNumber ?? 'missing'}`,
      `prStatus=${procurement?.status ?? 'missing'}`,
      `po=${procurementPo?.poNumber ?? 'missing'}`,
      `grns=${procurementPo?.goodsReceiptNotes.length ?? 0}`,
      `supplierInvoice=${procurementInvoice?.internalInvoiceNumber ?? 'missing'}`,
      `vendorPayment=${procurementPayment?.paymentNumber ?? 'missing'}`,
    ],
  });

  const invoice = await db.invoice.findFirst({
    where: { invoiceNumber: 'INV-2026-000101' },
    include: {
      billableAccount: { include: { residentAccount: { include: { ledgerEntries: true } } } },
      paymentAllocations: { include: { payment: { include: { receipts: true } } } },
    },
  });
  const payment = invoice?.paymentAllocations[0]?.payment;
  results.push({
    name: 'Resident Maintenance Payment Story',
    reference: 'INV-2026-000101 / PAY-2026-000101 / RCT-2026-000101',
    passed:
      invoice?.status === 'PAID' &&
      Number(invoice.grandTotal) === 3800 &&
      Number(invoice.outstandingAmount) === 0 &&
      payment?.paymentNumber === 'PAY-2026-000101' &&
      payment.receipts.some((receipt: any) => receipt.receiptNumber === 'RCT-2026-000101') &&
      invoice.billableAccount.residentAccount?.ledgerEntries.some(
        (entry: any) => entry.referenceId === invoice.invoiceNumber && Number(entry.debit) === 3800,
      ) === true &&
      invoice.billableAccount.residentAccount?.ledgerEntries.some(
        (entry: any) =>
          entry.referenceId === payment.paymentNumber && Number(entry.credit) === 3800,
      ) === true,
    details: [
      `invoice=${invoice?.invoiceNumber ?? 'missing'}`,
      `invoiceStatus=${invoice?.status ?? 'missing'}`,
      `payment=${payment?.paymentNumber ?? 'missing'}`,
      `receipts=${payment?.receipts.map((receipt: any) => receipt.receiptNumber).join(',') ?? 'missing'}`,
      `ledgerEntries=${invoice?.billableAccount.residentAccount?.ledgerEntries.length ?? 0}`,
    ],
  });

  const waterIncident = await db.safetyIncident.findUnique({
    where: { incidentNumber: 'INC-DEMO-WATER-QUALITY-01' },
    include: { actions: true, investigation: true, timelineEntries: true },
  });
  const failedWaterTest = await db.utilityQualityTest.findFirst({
    where: {
      communityId: community.id,
      sampleLocation: 'Domestic Water Tanker Inlet - Gate 2',
      parameter: 'TDS',
      status: 'FAILED',
    },
  });
  const passedWaterTest = await db.utilityQualityTest.findFirst({
    where: {
      communityId: community.id,
      sampleLocation: 'Domestic Water Tanker Inlet - Gate 2',
      parameter: 'TDS',
      status: 'PASSED',
    },
  });
  results.push({
    name: 'Water Quality Incident Story',
    reference: 'INC-DEMO-WATER-QUALITY-01',
    passed:
      waterIncident?.status === 'CLOSED' &&
      failedWaterTest != null &&
      passedWaterTest != null &&
      waterIncident.actions.some((action: any) => action.status === 'COMPLETED') &&
      waterIncident.investigation?.status === 'COMPLETED' &&
      waterIncident.timelineEntries.some((entry: any) => entry.entryType === 'CLOSURE'),
    details: [
      `incident=${waterIncident?.incidentNumber ?? 'missing'}`,
      `incidentStatus=${waterIncident?.status ?? 'missing'}`,
      `failedTest=${failedWaterTest?.result ?? 'missing'}`,
      `passedRetest=${passedWaterTest?.result ?? 'missing'}`,
      `actions=${waterIncident?.actions.length ?? 0}`,
      `investigation=${waterIncident?.investigation?.status ?? 'missing'}`,
    ],
  });

  for (const result of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`${status} ${result.name} [${result.reference}]`);
    for (const detail of result.details) console.log(`  - ${detail}`);
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    throw new Error(`Executive demo integrity failed for ${failed.length} story/stories.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
