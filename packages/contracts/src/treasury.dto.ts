export interface BankAccountResponseDto {
  id: string;
  accountingEntityId: string;
  name: string;
  bankName: string;
  accountType: string;
  currency: string;
  maskedAccountNumber: string;
  routingCode?: string | null;
  glAccountId: string;
  status: string;
  isDefault: boolean;
  createdAt: string;
}

export interface BankTransactionResponseDto {
  id: string;
  bankStatementId: string;
  bankAccountId: string;
  transactionDate: string;
  valueDate?: string | null;
  description: string;
  bankReference?: string | null;
  amount: number;
  direction: string;
  status: string;
  fingerprint: string;
}
