/** Formatage partagé serveur/client, sans dépendre des données ICU du navigateur. */
export function formatGrade(grade: number | null) {
  return grade === null ? "—" : `${String(grade).replace(".", ",")}/20`;
}

/**
 * À appeler côté serveur uniquement : les données de fuseaux horaires du navigateur peuvent
 * différer de celles de Node pour le Maroc, ce qui provoque une erreur d'hydratation.
 */
export function formatSubmissionDate(date: Date) {
  return date.toLocaleString("fr-MA", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Casablanca" });
}
