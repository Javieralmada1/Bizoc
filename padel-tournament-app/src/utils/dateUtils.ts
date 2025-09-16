export function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('es-ES', options).format(date);
}

export function compareDates(date1: Date, date2: Date): number {
    return date1.getTime() - date2.getTime();
}

export function isDateInFuture(date: Date): boolean {
    return date.getTime() > new Date().getTime();
}

export function addDaysToDate(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}