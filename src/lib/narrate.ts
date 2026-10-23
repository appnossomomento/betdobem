const kindLabel: Record<string, string> = {
  Goal: "Gol",
  "Own Goal": "Gol contra",
  "Yellow Card": "Cartão amarelo",
  "Red Card": "Cartão vermelho",
  Substitution: "Substituição",
  "Penalty - Scored": "Gol de pênalti",
  "Penalty - Missed": "Pênalti perdido",
  "Penalty - Saved": "Pênalti defendido",
  Halftime: "Intervalo",
  "End Regular Time": "Fim de jogo",
  Kickoff: "Começa o tempo",
  "Start 2nd Half": "Começa o segundo tempo",
  "Shot On Target": "Chute no gol",
  "Shot Off Target": "Chute para fora",
  "Shot Blocked": "Chute bloqueado",
  "Corner Awarded": "Escanteio",
  Foul: "Falta",
  Offside: "Impedimento",
  Handball: "Mão",
  "Start Delay": "Parada no jogo",
  "End Delay": "Jogo segue",
};

export function narrate(text: string, kind?: string) {
  const line = text.trim();
  const said = line ? phrase(line) : null;
  if (said) return said;
  if (kind && kindLabel[kind]) return kindLabel[kind];
  return null;
}

function phrase(line: string) {
  if (line === "Lineups are announced and players are warming up.") return "Escalações confirmadas.";
  const period =
    periodLine(line, "First Half begins", "Começa o primeiro tempo.") ??
    periodLine(line, "Second Half begins", "Começa o segundo tempo.") ??
    periodLine(line, "First Half ends", "Intervalo.") ??
    periodLine(line, "Second Half ends", "Fim de jogo.") ??
    periodLine(line, "Match ends", "Fim de jogo.");
  if (period) return period;
  if (line.startsWith("Delay over")) return "Jogo segue.";

  let match = line.match(/^Goal! (.+?) (\d+), (.+?) (\d+)\. (.+?) \((.+?)\) converts the penalty/i);
  if (match) return `Gol de pênalti de ${match[5]} (${match[6]}). ${scoreOf(match[1], match[2], match[3], match[4])}.`;

  match = line.match(/^Own Goal! (.+?) (\d+), (.+?) (\d+)\. (.+?) \((.+?)\)/i);
  if (match) return `Gol contra de ${match[5]} (${match[6]}). ${scoreOf(match[1], match[2], match[3], match[4])}.`;

  match = line.match(/^Goal! (.+?) (\d+), (.+?) (\d+)\. (.+?) \((.+?)\)/);
  if (match) return `Gol de ${match[5]} (${match[6]}). ${scoreOf(match[1], match[2], match[3], match[4])}.`;

  match = line.match(/^Attempt saved\. (.+?) \((.+?)\).+? by (.+?) \((.+?)\)/);
  if (match) return `Chute de ${match[1]} (${match[2]}). ${match[3]} (${match[4]}) defende.`;

  match = line.match(/^Attempt saved\. (.+?) \((.+?)\)/);
  if (match) return `Chute de ${match[1]} (${match[2]}) defendido.`;

  match = line.match(/^Attempt missed\. (.+?) \((.+?)\)/);
  if (match) return `Chute de ${match[1]} (${match[2]}) para fora.`;

  match = line.match(/^Attempt blocked\. (.+?) \((.+?)\)/);
  if (match) return `Chute de ${match[1]} (${match[2]}) bloqueado.`;

  match = line.match(/^Corner, (.+?)\./);
  if (match) return `Escanteio para ${match[1]}.`;

  match = line.match(/^Foul by (.+?) \((.+?)\)\./);
  if (match) return `Falta de ${match[1]} (${match[2]}).`;

  match = line.match(/^(.+?) \((.+?)\) wins a free kick/);
  if (match) return `Falta a favor de ${match[1]} (${match[2]}).`;

  match = line.match(/^Delay in match because of an injury (.+?) \((.+?)\)\./);
  if (match) return `Atendimento para ${match[1]} (${match[2]}).`;

  match = line.match(/^(.+?) \((.+?)\) is shown the yellow card/);
  if (match) return `Cartão amarelo para ${match[1]} (${match[2]}).`;

  match = line.match(/^(.+?) \((.+?)\) is shown the (?:red|second yellow) card/);
  if (match) return `Cartão vermelho para ${match[1]} (${match[2]}).`;

  match = line.match(/^Substitution, (.+?)\. (.+?) replaces (.+?)( because of an injury| due to an injury)?\./);
  if (match) return `Substituição (${match[1]}). Entra ${match[2]}, sai ${match[3]}.${match[4] ? " Lesão." : ""}`;

  match = line.match(/^Offside, (.+?)\. (.+?) is caught offside/);
  if (match) return `Impedimento de ${match[2]} (${match[1]}).`;

  match = line.match(/^Handball by (.+?) \((.+?)\)\./);
  if (match) return `Mão de ${match[1]} (${match[2]}).`;

  match = line.match(/^VAR Decision: Penalty (.+)\./);
  if (match) return `VAR marca pênalti para ${match[1]}.`;

  match = line.match(/^VAR Decision: No Penalty (.+)\./);
  if (match) return `VAR anula o pênalti de ${match[1]}.`;

  match = line.match(/^Penalty missed\.? (.+?) \((.+?)\)/i);
  if (match) return `Pênalti perdido por ${match[1]} (${match[2]}).`;

  return null;
}

function periodLine(line: string, prefix: string, lead: string) {
  if (!line.startsWith(prefix)) return null;
  const rest = line.slice(prefix.length).replace(/^[,\s]+/, "").replace(/\.$/, "");
  const score = rest.match(/^(.+) (\d+), (.+) (\d+)$/);
  if (!score) return lead;
  return `${lead} ${scoreOf(score[1], score[2], score[3], score[4])}.`;
}

function scoreOf(home: string, homeGoals: string, away: string, awayGoals: string) {
  return `${home} ${homeGoals}–${awayGoals} ${away}`;
}
