/**
 * Cálculos de arqueo — el efectivo esperado en caja solo incluye ventas en efectivo.
 */
export function summarizeShiftSales(salesRows) {
  let salesTotal = 0;
  let salesCount = 0;
  let cashSalesTotal = 0;
  let cardSalesTotal = 0;
  let transferSalesTotal = 0;

  for (const row of salesRows) {
    if (row.status !== "completed") continue;
    const total = Number(row.total ?? 0);
    salesCount += 1;
    salesTotal += total;

    if (row.paymentMethod === "card") {
      cardSalesTotal += total;
    } else if (row.paymentMethod === "transfer") {
      transferSalesTotal += total;
    } else {
      cashSalesTotal += total;
    }
  }

  return {
    salesTotal,
    salesCount,
    cashSalesTotal,
    cardSalesTotal,
    transferSalesTotal,
  };
}

export function summarizeMovements(movements) {
  let movementNet = 0;
  let incomeTotal = 0;
  let expenseTotal = 0;

  for (const m of movements) {
    const amount = Number(m.amount ?? 0);
    if (m.type === "income") {
      incomeTotal += amount;
      movementNet += amount;
    } else {
      expenseTotal += amount;
      movementNet -= amount;
    }
  }

  return { movementNet, incomeTotal, expenseTotal };
}

export function computeExpectedCash(openingCash, cashSalesTotal, movementNet) {
  return Number(openingCash) + cashSalesTotal + movementNet;
}
