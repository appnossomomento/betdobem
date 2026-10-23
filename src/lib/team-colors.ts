const colors: Record<string, string> = {
  "Athletico-PR": "#C8102E",
  "Atlético-MG": "#F2F2F2",
  Bahia: "#003DA5",
  Botafogo: "#F7F7F7",
  Chapecoense: "#007A33",
  Corinthians: "#D0D0D0",
  Coritiba: "#00543C",
  Cruzeiro: "#1B4FBF",
  Flamengo: "#C5261B",
  Fluminense: "#7A1535",
  Grêmio: "#0D80BF",
  Internacional: "#D7000F",
  Mirassol: "#F5C400",
  Palmeiras: "#006437",
  "Red Bull Bragantino": "#E10600",
  Remo: "#003087",
  Santos: "#FFFFFF",
  "São Paulo": "#C8102E",
  Vasco: "#E4E4E4",
  Vitória: "#E10600",
  Outro: "#8A8A8A",
  "Sem time": "#5C5C5C",
};

export function teamColor(team: string) {
  return colors[team] ?? "#8A8A8A";
}
