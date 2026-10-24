/** Dossiers pédagogiques créés par défaut, dans leur ordre d'affichage. */
export const DEFAULT_FORMATION_FOLDER_NAMES = ["Comprendre", "S'entraîner", "Se tester"];

function normalizeFolderName(name: string) {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'").trim().toLowerCase();
}

const DEFAULT_FOLDER_RANKS = new Map(DEFAULT_FORMATION_FOLDER_NAMES.map((name, index) => [normalizeFolderName(name), index]));

/** Place Comprendre, S'entraîner puis Se tester en tête ; les autres dossiers gardent leur ordre d'origine. */
export function sortFormationFolders<T extends { name: string }>(folders: T[]) {
  const rank = (folder: T) => DEFAULT_FOLDER_RANKS.get(normalizeFolderName(folder.name)) ?? DEFAULT_FOLDER_RANKS.size;
  return [...folders].sort((a, b) => rank(a) - rank(b));
}
