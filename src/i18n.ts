import { derived, writable } from 'svelte/store';

export type Locale = 'en' | 'hr';

const STORAGE_KEY = 'cabinet.locale';

const isLocale = (value: unknown): value is Locale => value === 'en' || value === 'hr';

const initialLocale: Locale = (() => {
  if (typeof localStorage === 'undefined') return 'en';
  const stored = localStorage.getItem(STORAGE_KEY);
  return isLocale(stored) ? stored : 'en';
})();

export const locale = writable<Locale>(initialLocale);

let currentLocale = initialLocale;
locale.subscribe((value) => {
  currentLocale = value;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, value);
  }
});

const translations: Record<Locale, Record<string, string>> = {
  en: {},
  hr: {
    'Visual Cabinet': 'Vizualni ormar',
    Planner: 'Planer',
    Settings: 'Postavke',
    Project: 'Projekt',
    'My project': 'Moj projekt',
    'Active project': 'Aktivni projekt',
    'Back to planner': 'Natrag u planer',
    Help: 'Pomoć',
    'Help & Instructions': 'Pomoć i upute',
    'Learn how to set up a project, add cabinets, and export layout files and cut lists.':
      'Nauči kako postaviti projekt, dodati elemente te izvesti tlocrte i liste rezova.',
    'Using the planner': 'Korištenje planera',
    'Add cabinets': 'Dodavanje elemenata',
    'Export layouts & cut lists': 'Izvoz tlocrta i lista rezova',
    'Start in Settings to enter your room size, materials, and pricing so costs are accurate.':
      'Kreni u Postavkama i upiši dimenzije prostorije, materijale i cijene kako bi izračun bio točan.',
    'Switch between Top, North Wall, and West Wall views and choose a plane for uppers to place cabinets on the correct wall.':
      'Prebacuj se između pogleda Odozgo, Sjeverni zid i Zapadni zid te odaberi ravninu za gornje elemente kako bi ih smjestio na pravi zid.',
    'Drag cabinets to move them, rotate from the Top view, and use the zoom buttons on the right to work at a comfortable scale.':
      'Povuci elemente za pomicanje, rotiraj ih u pogledu odozgo i koristi tipke zumiranja desno za ugodnu razmjeru.',
    'Use the Projects panel to save, rename, or back up layouts in this browser.':
      'Panel Projekti služi za spremanje, preimenovanje ili sigurnosnu kopiju rasporeda u ovom pregledniku.',
    'Click Add Cabinet in the toolbar.': 'Klikni Dodaj element u alatnoj traci.',
    'Choose the cabinet type (Door, Drawer, Corner, or Oven) and enter width, height, and depth in centimeters.':
      'Odaberi tip elementa (vrata, ladica, kutni ili pećnica) i upiši širinu, visinu i dubinu u centimetrima.',
    'Set doors, drawers, shelves, and back style; enable handleless or gola options if needed.':
      'Postavi vrata, ladice, police i tip leđa; uključi bezručke ili gola opcije po potrebi.',
    'Pick the drawer system and add notes when relevant, then review the live spec card.':
      'Odaberi sustav ladica i dodaj bilješke ako treba, zatim provjeri karticu sa specifikacijom.',
    'Save changes to place the cabinet, then drag, rotate, or duplicate it to position it.':
      'Spremi promjene kako bi postavio element, zatim ga povuci, rotiraj ili dupliciraj za pozicioniranje.',
    'Open {page} from the planner toolbar when you are ready to export.':
      'Otvori {page} iz alatne trake planera kada želiš izvesti podatke.',
    'Pick the CSV format: General for a universal cut list or Max Moris for the shop-specific template.':
      'Odaberi CSV format: General za univerzalnu listu rezova ili Max Moris za tvornički predložak.',
    'Click Download CSV to export the cut list (millimeter dimensions with edge banding flags).':
      'Klikni Preuzmi CSV za izvoz liste rezova (dimenzije u milimetrima s oznakama kantiranja).',
    'Use Download Dado Drawings or Download Rabbet Drawings to export SVGs for panels that include those cuts.':
      'Koristi Preuzmi crteže utora ili Preuzmi crteže ureza za SVG datoteke ploča koje imaju te obrade.',
    'Use Print for a PDF-friendly drawing set, then Back to return to the planner.':
      'Odaberi Ispis za skup crteža pogodan za PDF, a zatim Natrag za povratak u planer.',
    'Add Cabinet': 'Dodaj element',
    'Layout Summary': 'Sažetak tlocrta',
    Total: 'Ukupno',
    'Top View': 'Pogled odozgo',
    'North View': 'Pogled sa sjevera',
    'West View': 'Pogled sa zapada',
    'North Wall': 'Sjeverni zid',
    'West Wall': 'Zapadni zid',
    Language: 'Jezik',
    Plane: 'Ravnina',
    'Base cabinets': 'Donji elementi',
    'Upper cabinets ({height} mm)': 'Gornji elementi ({height} mm)',
    Base: 'Baza',
    North: 'Sjever',
    West: 'Zapad',
    'Cabinet {id}': 'Element {id}',
    W: 'Š',
    H: 'V',
    D: 'D',
    '{count} door(s)': '{count} vrata',
    '{count} shelf/shelves': '{count} polica',
    '{count} drawer(s)': '{count} ladica',
    'corner {fixed}mm fixed': 'kutni {fixed} mm fiksno',
    'oven with drawer': 'pećnica s ladicom',
    'Edit cabinet': 'Uredi element',
    'Add cabinet': 'Dodaj element',
    'Cabinet details': 'Detalji elementa',
    'Size, configure, and preview your cabinet before placing it in the layout.':
      'Odredi veličinu, konfiguriraj i pregledaj element prije postavljanja u raspored.',
    Cancel: 'Odustani',
    'Save changes': 'Spremi promjene',
    'Sizing & placement': 'Dimenzije i pozicioniranje',
    'Duplicate on save': 'Dupliciraj pri spremanju',
    'Width (cm)': 'Širina (cm)',
    'Height (cm)': 'Visina (cm)',
    'Depth (cm)': 'Dubina (cm)',
    Rotation: 'Rotacija',
    'Live spec': 'Trenutne specifikacije',
    'Volume {volume} L • Footprint {footprint} m²': 'Volumen {volume} L • Tlocrt {footprint} m²',
    'Mini preview': 'Brzi pregled',
    'Top / Isometric': 'Tlocrt / Izometrija',
    'Construction options': 'Opcije konstrukcije',
    'Full corpus': 'Puni korpus',
    'Add a full top panel instead of split planks.': 'Dodaj cijelu gornju ploču umjesto podijeljenih letvi.',
    'Inset back': 'Uvučena leđa',
    'Cuts dados to drop the back inside the sides. Cannot combine with rabbet back.':
      'Reže utore kako bi leđa ušla između stranica. Ne može se kombinirati s urezanim leđima.',
    'Rabbet back': 'Urezana leđa',
    'Rabbets the rear edge for the back panel. Mutually exclusive with inset back.':
      'Urezuje stražnji rub za leđnu ploču. Isključivo s uvučenim leđima.',
    'Hidden handles': 'Skriveni rukohvati',
    'Use handleless fronts for a clean look.': 'Koristi fronte bez ručki za čist izgled.',
    'Create door overhang for upper cabinets': 'Stvori prevjes vrata za viseće elemente',
    'Cabinet type': 'Vrsta elementa',
    Type: 'Tip',
    Door: 'Vrata',
    Drawer: 'Ladica',
    Corner: 'Kutni',
    Oven: 'Pećnica',
    Doors: 'Vrata (kom)',
    Shelves: 'Police',
    'Fixed side (cm)': 'Fiksna strana (cm)',
    Drawers: 'Ladice',
    'Heights (comma-separated %)': 'Visine (odvojene zarezom %)',
    'Drawer system': 'Sustav ladica',
    Wooden: 'Drvene',
    Metabox: 'Metabox',
    Vertex: 'Vertex',
    'Slide length': 'Dužina vodilica',
    'Railing height': 'Visina bočnice',
    Notes: 'Napomene',
    'Inset back and rabbet back are mutually exclusive; choosing one will disable the other.':
      'Uvučena i urezana leđa se međusobno isključuju; odabirom jednih isključuju se druga.',
    'If no back option is selected, the back will be cut from the corpus material.':
      'Ako leđa nisu odabrana, izrezat će se iz materijala korpusa.',
    'Dimensions are entered in centimeters for convenience.': 'Dimenzije se unose u centimetrima radi praktičnosti.',
    'Duplicate lets you save and place a copy offset to the side.': 'Dupliciranje sprema i postavlja kopiju pomaknutu u stranu.',
    'All dimensions (width, height, depth) must be filled.': 'Sve dimenzije (širina, visina, dubina) moraju biti popunjene.',
    'Please choose either inset back or rabbet back, not both.': 'Odaberite ili uvučena ili urezana leđa, ne oba.',
    'Fixed side dimension must be provided.': 'Potrebno je upisati dimenziju fiksne strane.',
    'Cost breakdown': 'Raščlamba troškova',
    Close: 'Zatvori',
    Panels: 'Ploče',
    'Boards × cost': 'Ploče × cijena',
    boards: 'ploča',
    Operations: 'Radovi',
    'Edge banding': 'Kantiranje',
    Cutting: 'Rezanje',
    Hardware: 'Okovi',
    Screws: 'Vijci',
    'Wood dowels': 'Drvene tiple',
    Hinges: 'Panti',
    'Drawer slides': 'Vodilice ladica',
    'Grand total': 'Ukupno',
    'Cost Summary': 'Sažetak troškova',
    'Edge Banding': 'Kantiranje',
    'Hardware BOM': 'Lista okova',
    'Project Settings': 'Postavke projekta',
    'Tune the room envelope and the materials you are pricing against. Grouped sections keep the difference between cabinet box, fronts, backs, and drawers clear.':
      'Podesi dimenzije prostorije i materijale za izračun cijene. Grupirani odjeljci jasno odvajaju korpus, fronte, leđa i ladice.',
    'Room envelope': 'Dimenzije prostorije',
    'Define the overall footprint you are designing for. Values are stored in centimeters for quick edits and converted back to millimeters for calculations.':
      'Definiraj ukupni tlocrt za koji projektiraš. Vrijednosti se spremaju u centimetrima radi brzih izmjena i pretvaraju u milimetre za proračune.',
    Width: 'Širina',
    Depth: 'Dubina',
    Height: 'Visina',
    'e.g. 400': 'npr. 400',
    'e.g. 300': 'npr. 300',
    'e.g. 250': 'npr. 250',
    'Panel materials': 'Materijali ploča',
    'Name and size the components that make up your cabinets. Keep the display name friendly while the thickness drives cut lists and clearances.':
      'Imenuj i dimenzioniraj komponente koje čine elemente. Naziv može biti prilagođen, a debljina utječe na liste rezova i zazore.',
    'Cabinet box (corpus)': 'Korpus (kutija elementa)',
    'Side panels, bottoms, and tops for the carcass.': 'Bočne stranice, dna i pokrov za korpus.',
    'Display name': 'Naziv',
    'Panel thickness': 'Debljina ploče',
    'Material cost (per m²)': 'Cijena materijala (po m²)',
    Fronts: 'Fronte',
    'Doors or drawer fronts visible to the user.': 'Vrata ili fronte ladica vidljive korisniku.',
    Backs: 'Leđa',
    'Thin panels for cabinet backs or drawer bottoms.': 'Tanke ploče za leđa elemenata ili dna ladica.',
    'Drawer boxes': 'Kutije ladica',
    'Sides and fronts that make up drawer internals.': 'Stranice i fronte koje čine unutrašnjost ladice.',
    'Edge & fabrication costs': 'Kantiranje i izrada',
    'Capture per-meter operations so pricing reflects edge banding and cutting labor.':
      'Zabilježi trošak po metru kako bi cijena uključila kantiranje i rezanje.',
    'Edge banding (per m)': 'Kantiranje (po m)',
    'Cutting (per m)': 'Rezanje (po m)',
    'Save to immediately apply dimensions and rates to cabinet calculations.':
      'Spremi kako bi se dimenzije i cijene odmah primijenile na izračune elemenata.',
    General: 'Općenito',
    'Download CSV': 'Preuzmi CSV',
    'Download Dado Drawings': 'Preuzmi crteže utora',
    'Download Rabbet Drawings': 'Preuzmi crteže ureza',
    Print: 'Ispis',
    Back: 'Natrag',
    'Cabinet layout summary': 'Sažetak rasporeda elemenata',
    '3D View': '3D prikaz',
    'Total width: {width} mm · Total height: {height} mm': 'Ukupna širina: {width} mm · Ukupna visina: {height} mm',
    'Rotated for print': 'Rotirano za ispis',
    'Total {width} mm': 'Ukupno {width} mm',
    'Cabinet Drawings': 'Crteži elemenata',
    WidthLabel: 'Širina',
    HeightLabel: 'Visina',
    DepthLabel: 'Dubina',
    Clearance: 'Zazor',
    'Drawer Height': 'Visina ladice',
    'Fixed Side': 'Fiksna strana',
    'Dados & Rabbets': 'Utor i urez',
    'Qty {count}': 'Kom {count}',
    'No rabbet panels found.': 'Nema ploča s urezom.',
    Projects: 'Projekti',
    'Autosaved to this browser': 'Automatski se sprema u ovaj preglednik',
    'Create a project': 'Stvori projekt',
    'Name your work and choose if you want to start from the current layout or a blank canvas.':
      'Imenuj projekt i odaberi želiš li krenuti od trenutnog rasporeda ili praznog platna.',
    Autosave: 'Automatsko spremanje',
    'Project name': 'Naziv projekta',
    'Kitchen refresh': 'Osvježenje kuhinje',
    'Start from current layout': 'Započni od trenutnog rasporeda',
    'Create and switch': 'Stvori i pređi',
    Reset: 'Resetiraj',
    'Updated {date}': 'Ažurirano {date}',
    Active: 'Aktivno',
    Rename: 'Preimenuj',
    Delete: 'Obriši',
    'Download backup': 'Preuzmi sigurnosnu kopiju',
    'Load backup into active': 'Učitaj kopiju u aktivni',
    'Invalid backup file.': 'Neispravna sigurnosna kopija.',
    'Untitled project': 'Projekt bez naziva',
    'Saved projects': 'Spremljeni projekti',
    '{count} saved': '{count} spremljeno',
    'No projects yet.': 'Još nema projekata.',
    'Open project': 'Otvori projekt',
    Download: 'Preuzmi',
    Save: 'Spremi',
    Backups: 'Sigurnosne kopije',
    'Download JSON': 'Preuzmi JSON',
    'Upload JSON': 'Učitaj JSON',
    'Invalid JSON file': 'Neispravna JSON datoteka'
  }
};

const format = (template: string, vars?: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => `${vars?.[key] ?? ''}`);

export const t = derived(locale, ($locale) => {
  return (key: string, vars?: Record<string, string | number>) => {
    const template = translations[$locale]?.[key] ?? key;
    return format(template, vars);
  };
});

export const translateInstant = (key: string, vars?: Record<string, string | number>) => {
  const template = translations[currentLocale]?.[key] ?? key;
  return format(template, vars);
};

export const locales = [
  { code: 'en' as Locale, label: 'English' },
  { code: 'hr' as Locale, label: 'Hrvatski' }
];
