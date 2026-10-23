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
