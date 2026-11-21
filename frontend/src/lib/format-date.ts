const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatDate(value: string): string {
  return dateFormat.format(new Date(value)).replace(/\./g, '');
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
