// Le "destinazioni popolari" della barra di ricerca sono nomi di regione, ma
// l'indirizzo di una Property è un indirizzo puntuale (via, città, sigla
// provincia) che quasi mai contiene scritto il nome della regione per
// esteso — es. "Weihergasse, 96, 21068 Predoi BZ" non contiene mai
// "Trentino-Alto Adige". Il match testuale semplice quindi fallisce sempre
// per queste ricerche. Questa mappa collega ogni regione alle sigle
// provincia che ci si aspetta di trovare in coda all'indirizzo, così il
// filtro può riconoscerle anche senza il nome della regione scritto per
// esteso. Copre per ora solo le regioni proposte come scorciatoia rapida
// nella home; un indirizzo di una provincia non elencata qui continua a
// funzionare con il normale match testuale (nome città/via digitato).
export const REGION_PROVINCE_CODES: Record<string, string[]> = {
  toscana: ["FI", "PI", "SI", "AR", "GR", "LI", "LU", "MS", "PO", "PT"],
  "trentino-alto adige": ["TN", "BZ"],
  liguria: ["GE", "SP", "SV", "IM"],
  puglia: ["BA", "BR", "BT", "FG", "LE", "TA"],
  sicilia: ["AG", "CL", "CT", "EN", "ME", "PA", "RG", "SR", "TP"],
  sardegna: ["CA", "NU", "OR", "SS", "SU"],
};
