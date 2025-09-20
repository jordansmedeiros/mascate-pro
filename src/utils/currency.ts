/**
 * Utilitários para formatação de valores monetários no padrão brasileiro
 */

/**
 * Formata um valor numérico para moeda brasileira
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como R$ 1.234,56
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formata um valor numérico como moeda brasileira sem o símbolo R$
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como 1.234,56
 */
export const formatCurrencyValue = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Converte string de moeda brasileira para número
 * Aceita formatos como: "1.234,56", "1234,56", "1,234.56"
 * @param value - String com valor monetário
 * @returns Número convertido
 */
export const parseCurrencyValue = (value: string): number => {
  if (!value) return 0;

  // Remove espaços e símbolos de moeda
  let cleanValue = value.replace(/[R$\s]/g, '');

  // Se contém vírgula e ponto, assume formato brasileiro (1.234,56)
  if (cleanValue.includes(',') && cleanValue.includes('.')) {
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
  }
  // Se contém apenas vírgula, assume formato brasileiro (1234,56)
  else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
    cleanValue = cleanValue.replace(',', '.');
  }

  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formata input de moeda enquanto o usuário digita
 * @param value - Valor atual do input
 * @returns Valor formatado para exibição
 */
export const formatCurrencyInput = (value: string): string => {
  const numericValue = parseCurrencyValue(value);
  return formatCurrencyValue(numericValue);
};