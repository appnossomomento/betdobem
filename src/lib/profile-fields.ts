export const TEAMS = [
  "Athletico-PR",
  "Atlético-MG",
  "Bahia",
  "Botafogo",
  "Chapecoense",
  "Corinthians",
  "Coritiba",
  "Cruzeiro",
  "Flamengo",
  "Fluminense",
  "Grêmio",
  "Internacional",
  "Mirassol",
  "Palmeiras",
  "Red Bull Bragantino",
  "Remo",
  "Santos",
  "São Paulo",
  "Vasco",
  "Vitória",
  "Outro",
] as const;

export const SIZES = ["PP", "P", "M", "G", "GG", "XG"] as const;

export type ProfileInput = {
  nick: string;
  age: number;
  city: string;
  favoriteTeam: string;
  shirtSize: string;
  bottomSize: string;
};

export function cpfDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function formatCpf(value: string) {
  const digits = cpfDigits(value);
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function checkCpf(value: string) {
  const cpf = cpfDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return "CPF inválido.";
  const digit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  if (digit(9) !== Number(cpf[9]) || digit(10) !== Number(cpf[10])) return "CPF inválido.";
  return "";
}

export function initialsFrom(nick: string) {
  const clean = nick.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]/g, "");
  return (clean.slice(0, 2) || "JB").toUpperCase();
}

export function checkProfile(input: ProfileInput) {
  const nick = input.nick.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(nick)) return "Apelido de 3 a 16 letras, números ou _.";
  if (!Number.isInteger(input.age) || input.age < 10 || input.age > 120) return "Idade fora da faixa.";
  const city = input.city.trim();
  if (city.length < 2 || city.length > 48) return "Cidade inválida.";
  if (!TEAMS.includes(input.favoriteTeam as (typeof TEAMS)[number])) return "Escolha um time.";
  if (!SIZES.includes(input.shirtSize as (typeof SIZES)[number])) return "Escolha o tamanho da camisa.";
  if (!SIZES.includes(input.bottomSize as (typeof SIZES)[number])) return "Escolha o tamanho do short ou da calça.";
  return "";
}
