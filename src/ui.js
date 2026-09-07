/* ==========================================================================
   FLYRADAR — USER INTERFACE CONTROLLER
   ========================================================================== */

import { AIRPORTS } from './simulation.js';
import { fetchAirportWeather, windDirToCompass } from './weather.js';

// ==========================================================================
// AIRCRAFT PHOTO & LIVERY DATABASE (Curated offline-ready HD + Dynamic)
// ==========================================================================
const AIRCRAFT_GALLERY = {
  afr_a320: {
    file: './aircraft/afr_a320.jpg',
    model: 'Airbus A320',
    airline: 'Air France',
    photographer: 'Riik@mctr',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Airbus_A320_F-GKXS_of_Air_France_0.jpg',
    tag: 'LIVRÉE AIR FRANCE'
  },
  afr_a350: {
    file: './aircraft/afr_a350.jpg',
    model: 'Airbus A350-900',
    airline: 'Air France',
    photographer: 'Anna Zvereva',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Air_France,_F-HTYS,_Airbus_A350-941_(54008313536).jpg',
    tag: 'LIVRÉE AIR FRANCE'
  },
  afr_b777: {
    file: './aircraft/afr_b777.jpg',
    model: 'Boeing 777-300ER',
    airline: 'Air France',
    photographer: 'Maxime ✈',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Boeing_777-300ER_(Air_France)_(26115950534).jpg',
    tag: 'LIVRÉE AIR FRANCE'
  },
  afr_a220: {
    file: './aircraft/afr_a220.jpg',
    model: 'Airbus A220-300',
    airline: 'Air France',
    photographer: 'Simon Butler',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:AIR_FRANCE_AIRBUS_A220-300_F-HZUS_(54119847928).jpg',
    tag: 'LIVRÉE AIR FRANCE'
  },
  ezy_a320: {
    file: './aircraft/ezy_a320.jpg',
    model: 'Airbus A320',
    airline: 'EasyJet',
    photographer: 'Robbie Klinkenberg',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:EasyJet_Europe_Airbus_A320_OE-IJG_at_Schiphol_27-08-2021.jpg',
    tag: 'LIVRÉE EASYJET'
  },
  ryr_b738: {
    file: './aircraft/ryr_b738.jpg',
    model: 'Boeing 737-800',
    airline: 'Ryanair',
    photographer: 'Ralf Roletschek',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:16-09-01-R%C4%ABgas_Starptautisk%C4%81_Lidosta-RR2_4578.jpg',
    tag: 'LIVRÉE RYANAIR'
  },
  tvf_b738: {
    file: './aircraft/tvf_b738.jpg',
    model: 'Boeing 737-800',
    airline: 'Transavia France',
    photographer: 'Spotting973',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Boeing_737-8K2_Transavia_F-GZHS_(23035101549).jpg',
    tag: 'LIVRÉE TRANSAVIA'
  },
  dlh_a320: {
    file: './aircraft/dlh_a320.jpg',
    model: 'Airbus A320',
    airline: 'Lufthansa',
    photographer: 'Raimond Spekking',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lufthansa_-_Airbus_A320-200_-_Frankfurt_am_Main_-_D-AIUG-0330.jpg',
    tag: 'LIVRÉE LUFTHANSA'
  },
  baw_b787: {
    file: './aircraft/baw_b787.jpg',
    model: 'Boeing 787-9',
    airline: 'British Airways',
    photographer: 'Anna Zvereva',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:British_Airways,_G-ZBJH,_Boeing_787-8_Dreamliner.jpg',
    tag: 'LIVRÉE BRITISH AIRWAYS'
  },
  baw_a320: {
    file: './aircraft/baw_a320.jpg',
    model: 'Airbus A320',
    airline: 'British Airways',
    photographer: 'Juergen Lehle',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:British_Airways_A320-100_G-BUSB.jpg',
    tag: 'LIVRÉE BRITISH AIRWAYS'
  },
  uae_a380: {
    file: './aircraft/uae_a380.jpg',
    model: 'Airbus A380-800',
    airline: 'Emirates',
    photographer: 'Julian Herzog',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Emirates_Airbus_A380-861_A6-EER_MUC_2015_04.jpg',
    tag: 'LIVRÉE EMIRATES'
  },
  klm_b738: {
    file: './aircraft/klm_b738.jpg',
    model: 'Boeing 737-800',
    airline: 'KLM Royal Dutch',
    photographer: 'Julian Herzog',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:KLM_Boeing_737-7K2_PH-BGT_MUC_2015_01.jpg',
    tag: 'LIVRÉE KLM'
  },
  dal_a350: {
    file: './aircraft/dal_a350.jpg',
    model: 'Airbus A350-900',
    airline: 'Delta Air Lines',
    photographer: 'Spotter',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Delta%27s_first_A350_(36267955141).jpg',
    tag: 'LIVRÉE DELTA'
  },
  vlg_a320: {
    file: './aircraft/vlg_a320.jpg',
    model: 'Airbus A320',
    airline: 'Vueling',
    photographer: 'Pablo Nicolás Taibi Cicare',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Aeropuerto_El_Prat,_Barcelona_(4296897670).jpg',
    tag: 'LIVRÉE VUELING'
  },
  wzz_a321: {
    file: './aircraft/wzz_a321.jpg',
    model: 'Airbus A321neo',
    airline: 'Wizz Air',
    photographer: 'Raimond Spekking',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Wizz_Air_-_HA-LXN_-_Airbus_A321_-_Frankfurt-Hahn_Airport-0316.jpg',
    tag: 'LIVRÉE WIZZ AIR'
  },
  ga_dr400: {
    file: './aircraft/ga_dr400.jpg',
    model: 'Robin DR400 Major',
    airline: 'Aviation Générale',
    photographer: 'Pierre André Leclercq',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Robin_DR400_at_Lille_-_Marcq-en-Bar%C5%93ul_Airport.jpg',
    tag: 'AÉROCLUB / LÉGER'
  },
  ga_c172: {
    file: './aircraft/ga_c172.jpg',
    model: 'Cessna 172 Skyhawk',
    airline: 'Aviation Générale',
    photographer: 'Cjp24',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Cessna_172_Skyhawk_II,_F-BXZQ,_in_flight.jpg',
    tag: 'AVIATION GÉNÉRALE'
  },
  heli_samu: {
    file: './aircraft/heli_samu.jpg',
    model: 'Eurocopter EC145 SAMU',
    airline: 'SAMU Secours Médical',
    photographer: 'Daxipedia',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Eurocopter_EC145_F-HSOX_-_SAMU_64.jpg',
    tag: 'SECOURS SAMU'
  },
  heli_dragon: {
    file: './aircraft/heli_dragon.jpg',
    model: 'Eurocopter EC145 Dragon',
    airline: 'Sécurité Civile',
    photographer: 'Maxime ✈',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:F-ZBQG_(16935859366).jpg',
    tag: 'SÉCURITÉ CIVILE'
  },
  mil_rafale: {
    file: './aircraft/mil_rafale.jpg',
    model: 'Dassault Rafale C',
    airline: 'Armée de l\'Air et de l\'Espace',
    photographer: 'Ank Kumar',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:%27113-GU%27_French_Air_Force_Dassault_Rafale_C_with_afterburners_at_Air14,_Payerne,_Switzerland_(Ank_Kumar)_04.jpg',
    tag: 'CHASSE MILITAIRE'
  },
  mil_m2000: {
    file: './aircraft/mil_m2000.jpg',
    model: 'Dassault Mirage 2000-5',
    airline: 'Armée de l\'Air et de l\'Espace',
    photographer: 'U.S. Navy / Paul Farley',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Dassault_Mirage_2000-5_participating_in_Odyssey_Dawn.jpg',
    tag: 'CHASSE MILITAIRE'
  },
  mil_a400m: {
    file: './aircraft/mil_a400m.jpg',
    model: 'Airbus A400M Atlas',
    airline: 'Armée de l\'Air et de l\'Espace',
    photographer: 'U.S. Air Force / Tech. Sgt.',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:French_Air_Force_arrive_in_Airbus_A400M_Atlas_(6268165).jpg',
    tag: 'TRANSPORT MILITAIRE'
  },
  vip_fa7x: {
    file: './aircraft/vip_fa7x.jpg',
    model: 'Dassault Falcon 7X',
    airline: 'République Française (COTAM)',
    photographer: 'Alexandre Prévot',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Dassault_Falcon_7X_R%C3%A9publique_Fran%C3%A7aise_(4155964002).jpg',
    tag: 'VOL OFFICIEL / VIP'
  },
  vip_glf6: {
    file: './aircraft/vip_glf6.jpg',
    model: 'Gulfstream G650ER',
    airline: 'Aviation d\'Affaires',
    photographer: 'Adrian Pingstone',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gulfstream_G650_departs_Bristol_23rdAug2014_arp.jpg',
    tag: 'AVIATION D\'AFFAIRES'
  }
};

/**
 * Resolves a curated, verified high-resolution photograph instantly (0ms latency).
 */
export function resolveCuratedAircraftPhoto(flight) {
  const airlineCode = (flight.airline?.code || '').toUpperCase();
  const airlineName = (flight.airline?.name || '').toUpperCase();
  const callsign = (flight.flightNumber || flight.callsign || '').toUpperCase();
  const model = ((flight.aircraftModel || '') + ' ' + (flight.t || '') + ' ' + (flight.desc || '')).toUpperCase();
  const category = (flight.category || '').toUpperCase();

  // 1. Helicopters / Emergency Rescue
  if (callsign.includes('DRAGON') || callsign.includes('SECURITE CIVILE')) {
    return { ...AIRCRAFT_GALLERY.heli_dragon, tag: 'SÉCURITÉ CIVILE' };
  }
  if (callsign.includes('SAMU') || callsign.includes('SMU') || airlineCode === 'SMU') {
    return { ...AIRCRAFT_GALLERY.heli_samu, tag: 'SECOURS SAMU' };
  }
  if (category === 'HELI' || model.includes('H145') || model.includes('EC145') || model.includes('H135') || model.includes('EC135') || model.includes('AS350')) {
    return { ...AIRCRAFT_GALLERY.heli_samu, tag: 'HÉLICOPTÈRE' };
  }

  // 2. Military
  if (category === 'MILITARY' || callsign.startsWith('FAF') || callsign.startsWith('CTM') || callsign.startsWith('NATO') || callsign.startsWith('RFAL')) {
    if (model.includes('M2000') || model.includes('MIR2') || callsign.startsWith('M2K')) {
      return { ...AIRCRAFT_GALLERY.mil_m2000, tag: 'CHASSE MILITAIRE' };
    }
    if (model.includes('A400') || model.includes('C130') || model.includes('C160')) {
      return { ...AIRCRAFT_GALLERY.mil_a400m, tag: 'TRANSPORT MILITAIRE' };
    }
    return { ...AIRCRAFT_GALLERY.mil_rafale, tag: 'CHASSE MILITAIRE' };
  }
  if (model.includes('RAFALE') || model.includes('RFAL')) {
    return { ...AIRCRAFT_GALLERY.mil_rafale, tag: 'CHASSE MILITAIRE' };
  }

  // 3. VIP / Official / Business Jets
  if (callsign.includes('COTAM') || callsign.includes('CTM01') || callsign.includes('CTM0001') || callsign.includes('REPUBLIQUE') || model.includes('FA7X') || model.includes('FA8X') || model.includes('F900')) {
    return { ...AIRCRAFT_GALLERY.vip_fa7x, tag: 'VOL OFFICIEL / VIP' };
  }
  if (category === 'PRIVATE' || model.includes('GLF') || model.includes('G650') || model.includes('G550') || model.includes('GLOBAL') || model.includes('CITATION')) {
    return { ...AIRCRAFT_GALLERY.vip_glf6, tag: 'AVIATION D\'AFFAIRES' };
  }

  // 4. Light Aviation / Aéroclubs
  if (model.includes('DR40') || model.includes('ROBIN') || callsign.startsWith('F-H') || callsign.startsWith('F-G')) {
    if (model.includes('C172') || model.includes('CESSNA') || model.includes('PA28') || model.includes('ARCHER')) {
      return { ...AIRCRAFT_GALLERY.ga_c172, tag: 'AVIATION GÉNÉRALE' };
    }
    return { ...AIRCRAFT_GALLERY.ga_dr400, tag: 'AÉROCLUB / LÉGER' };
  }
  if (model.includes('C172') || model.includes('CESSNA') || model.includes('PA28') || model.includes('DA42')) {
    return { ...AIRCRAFT_GALLERY.ga_c172, tag: 'AVIATION GÉNÉRALE' };
  }

  // 5. Commercial Airlines Specific Liveries
  if (airlineCode === 'AFR' || airlineCode === 'AF' || airlineName.includes('AIR FRANCE') || callsign.startsWith('AFR') || callsign.startsWith('AF')) {
    if (model.includes('350') || model.includes('A359') || model.includes('A35K')) return { ...AIRCRAFT_GALLERY.afr_a350, tag: 'LIVRÉE AIR FRANCE' };
    if (model.includes('777') || model.includes('B77') || model.includes('77W')) return { ...AIRCRAFT_GALLERY.afr_b777, tag: 'LIVRÉE AIR FRANCE' };
    if (model.includes('220') || model.includes('BCS3') || model.includes('A220')) return { ...AIRCRAFT_GALLERY.afr_a220, tag: 'LIVRÉE AIR FRANCE' };
    return { ...AIRCRAFT_GALLERY.afr_a320, tag: 'LIVRÉE AIR FRANCE' };
  }

  if (airlineCode === 'EZY' || airlineCode === 'EZ' || airlineCode === 'U2' || airlineCode === 'EJU' || airlineCode === 'EZS' || airlineName.includes('EASYJET') || callsign.startsWith('EZY')) {
    return { ...AIRCRAFT_GALLERY.ezy_a320, tag: 'LIVRÉE EASYJET' };
  }

  if (airlineCode === 'RYR' || airlineCode === 'FR' || airlineCode === 'RYS' || airlineName.includes('RYANAIR') || callsign.startsWith('RYR')) {
    return { ...AIRCRAFT_GALLERY.ryr_b738, tag: 'LIVRÉE RYANAIR' };
  }

  if (airlineCode === 'TVF' || airlineCode === 'TO' || airlineCode === 'TRA' || airlineCode === 'HV' || airlineName.includes('TRANSAVIA') || callsign.startsWith('TVF')) {
    return { ...AIRCRAFT_GALLERY.tvf_b738, tag: 'LIVRÉE TRANSAVIA' };
  }

  if (airlineCode === 'DLH' || airlineCode === 'LH' || airlineName.includes('LUFTHANSA') || callsign.startsWith('DLH')) {
    return { ...AIRCRAFT_GALLERY.dlh_a320, tag: 'LIVRÉE LUFTHANSA' };
  }

  if (airlineCode === 'BAW' || airlineCode === 'BA' || airlineName.includes('BRITISH') || callsign.startsWith('BAW')) {
    if (model.includes('787') || model.includes('B78')) return { ...AIRCRAFT_GALLERY.baw_b787, tag: 'LIVRÉE BRITISH AIRWAYS' };
    return { ...AIRCRAFT_GALLERY.baw_a320, tag: 'LIVRÉE BRITISH AIRWAYS' };
  }

  if (airlineCode === 'UAE' || airlineCode === 'EK' || airlineName.includes('EMIRATES') || callsign.startsWith('UAE')) {
    return { ...AIRCRAFT_GALLERY.uae_a380, tag: 'LIVRÉE EMIRATES' };
  }

  if (airlineCode === 'KLM' || airlineCode === 'KL' || airlineName.includes('KLM') || callsign.startsWith('KLM')) {
    return { ...AIRCRAFT_GALLERY.klm_b738, tag: 'LIVRÉE KLM' };
  }

  if (airlineCode === 'DAL' || airlineCode === 'DL' || airlineName.includes('DELTA') || callsign.startsWith('DAL')) {
    return { ...AIRCRAFT_GALLERY.dal_a350, tag: 'LIVRÉE DELTA' };
  }

  if (airlineCode === 'VLG' || airlineCode === 'VY' || airlineName.includes('VUELING') || callsign.startsWith('VLG')) {
    return { ...AIRCRAFT_GALLERY.vlg_a320, tag: 'LIVRÉE VUELING' };
  }

  if (airlineCode === 'WZZ' || airlineCode === 'W6' || airlineName.includes('WIZZ') || callsign.startsWith('WZZ')) {
    return { ...AIRCRAFT_GALLERY.wzz_a321, tag: 'LIVRÉE WIZZ AIR' };
  }

  // 6. Generic commercial models fallback
  if (model.includes('350') || model.includes('A359')) return { ...AIRCRAFT_GALLERY.afr_a350, tag: 'AIRBUS A350' };
  if (model.includes('777') || model.includes('B77')) return { ...AIRCRAFT_GALLERY.afr_b777, tag: 'BOEING 777' };
  if (model.includes('787') || model.includes('B78')) return { ...AIRCRAFT_GALLERY.baw_b787, tag: 'BOEING 787' };
  if (model.includes('380') || model.includes('A388')) return { ...AIRCRAFT_GALLERY.uae_a380, tag: 'AIRBUS A380' };
  if (model.includes('737') || model.includes('738') || model.includes('B738') || model.includes('B38M')) return { ...AIRCRAFT_GALLERY.ryr_b738, tag: 'BOEING 737' };
  if (model.includes('320') || model.includes('321') || model.includes('A20N') || model.includes('A21N')) return { ...AIRCRAFT_GALLERY.afr_a320, tag: 'AIRBUS A320' };

  // 7. Ultimate fallback
  return { ...AIRCRAFT_GALLERY.afr_a320, tag: 'PHOTO APPAREIL' };
}

// Dynamic Wikimedia search cache
const dynamicPhotoCache = new Map();

/**
 * Optional background upgrade: attempts to query Wikimedia Commons for an exact aircraft tail/registration.
 */
async function fetchDynamicAircraftPhoto(flight) {
  const reg = (flight.registration || flight.r || '').trim();
  const airlineName = flight.airline?.name || '';
  const model = flight.aircraftModel || flight.t || '';
  const cacheKey = (reg || `${airlineName}_${model}`).toLowerCase();
  
  if (!cacheKey) return null;
  if (dynamicPhotoCache.has(cacheKey)) return dynamicPhotoCache.get(cacheKey);

  // If already a well-covered top airline without a specific tail registration, stick with curated HD
  const isTopAirline = ['Air France', 'EasyJet', 'Ryanair', 'Transavia France', 'Lufthansa', 'British Airways', 'Emirates', 'KLM Royal Dutch', 'Delta Air Lines', 'Vueling', 'Wizz Air'].includes(airlineName);
  if (isTopAirline && !reg) {
    dynamicPhotoCache.set(cacheKey, null);
    return null;
  }

  try {
    const searchTerm = reg ? `${reg} aircraft` : `${airlineName} ${model}`.trim();
    if (searchTerm.length < 4) return null;

    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(searchTerm)}&gsrlimit=3&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=720&format=json&origin=*`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(2200) });
    if (!res.ok) {
      dynamicPhotoCache.set(cacheKey, null);
      return null;
    }
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});
    const match = pages.find(p => p.title && p.title.match(/\.(jpg|jpeg|png)$/i) && p.imageinfo?.[0]?.thumburl);
    if (match) {
      const info = match.imageinfo[0];
      let artist = (info.extmetadata?.Artist?.value || 'Wikimedia Spotter').replace(/<[^>]+>/g, '').trim();
      const photoInfo = {
        file: info.thumburl,
        photographer: artist.slice(0, 35) || 'Spotter',
        sourceUrl: info.descriptionurl || 'https://commons.wikimedia.org',
        tag: 'PHOTO SPOTTER'
      };
      dynamicPhotoCache.set(cacheKey, photoInfo);
      return photoInfo;
    }
  } catch (_) {
    // Silent fallback to curated photo
  }

  dynamicPhotoCache.set(cacheKey, null);
  return null;
}

export class UIController {

  constructor(appState) {
    this.appState = appState; // Reference to core app state
    this.currentAirportCode = 'CDG';
    this.activeBottomTab = ''; // 'airports', 'history', 'tactical'
    this.weatherCache = new Map(); // cache to optimize weather fetches
  }

  init() {
    this.registerEventListeners();
    this.updateAirportStatsPanel();
  }

  registerEventListeners() {
    // Left Sidebar: Close details
    document.getElementById('close-details-btn').addEventListener('click', () => {
      this.deselectFlight();
    });

    // Main Header: Filters (aircraft category & tactical filters)
    const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        this.appState.filterCategory = filter;
        const visible = this.appState.map.updateMarkers(this.appState.simulation.flights, this.appState.selectedFlight?.id, filter);
        const activeEl = document.getElementById('stat-active-flights');
        if (activeEl) activeEl.innerText = visible.length;
        const squawkEl = document.getElementById('stat-active-squawks');
        if (squawkEl) squawkEl.innerText = visible.filter(f => f.isEmergency).length;

        if (this.appState.radar3d && this.appState.radar3d.isActive) {
          this.appState.radar3d.update3DAirspace(this.appState.simulation.flights, this.appState.selectedFlight?.id, filter);
        }
      });
    });

    // Main Header: Search
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length > 0) {
        searchResults.classList.remove('hidden');
      }
    });

    // Click outside search to close
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });

    // Weather Radar Toggle Button (RainViewer live layer)
    const weatherBtn = document.getElementById('weather-radar-btn');
    if (weatherBtn) {
      weatherBtn.addEventListener('click', async () => {
        weatherBtn.classList.add('loading');
        const isActive = await this.appState.map.toggleRainRadar();
        weatherBtn.classList.remove('loading');
        if (isActive) {
          weatherBtn.classList.add('active');
          this.showToast('🌧️ Radar de pluie activé (RainViewer)');
        } else {
          weatherBtn.classList.remove('active');
          this.showToast('🌤️ Radar météo désactivé');
        }
      });
    }

    // 3D Radar vs 2D Map Toggle Button
    const view3dBtn = document.getElementById('view-mode-toggle-btn');
    if (view3dBtn) {
      view3dBtn.addEventListener('click', () => {
        const is3D = this.appState.is3DMode = !this.appState.is3DMode;
        if (is3D) {
          view3dBtn.classList.add('active');
          view3dBtn.innerHTML = `<i data-lucide="map"></i> <span>2D CARTE</span>`;
          document.getElementById('map').classList.add('hidden');
          if (this.appState.radar3d) {
            this.appState.radar3d.setActive(true);
            this.appState.radar3d.update3DAirspace(
              this.appState.simulation.flights,
              this.appState.selectedFlight?.id,
              this.appState.filterCategory
            );
          }
          this.showToast('🌐 Mode 3D Globe Tactique activé');
        } else {
          view3dBtn.classList.remove('active');
          view3dBtn.innerHTML = `<i data-lucide="globe"></i> <span>Mode 3D</span>`;
          document.getElementById('map').classList.remove('hidden');
          if (this.appState.radar3d) {
            this.appState.radar3d.setActive(false);
          }
          this.appState.map.map.invalidateSize();
          this.appState.map.updateMarkers(
            this.appState.simulation.flights,
            this.appState.selectedFlight?.id,
            this.appState.filterCategory
          );
          this.showToast('🗺️ Retour en mode carte 2D');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
      });
    }

    // Theme Toggle Button (Map Only)
    let isLightMode = false;
    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      isLightMode = !isLightMode;
      this.appState.map.switchTheme(isLightMode);
      
      const btn = document.getElementById('theme-toggle-btn');
      const icon = isLightMode ? 'sun' : 'moon';
      const text = isLightMode ? 'Clair' : 'Sombre';
      
      btn.innerHTML = `<i data-lucide="${icon}"></i> ${text}`;
      lucide.createIcons();
    });


    // AR Toggle Button
    document.getElementById('ar-toggle-btn').addEventListener('click', () => {
      this.appState.ar.start();
    });

    // Listen to Airport clicks on the map
    document.addEventListener('airportSelected', (e) => {
      const code = e.detail;
      this.currentAirportCode = code;
      this.toggleRightSidebar('airports');
    });

    // Left Sidebar: Center Map on selected flight — always fetch latest position
    document.getElementById('det-focus-btn').addEventListener('click', () => {
      if (this.appState.selectedFlight) {
        // Get the latest live position of this flight
        const latest = this.appState.simulation.flights.find(f => f.id === this.appState.selectedFlight.id)
          || this.appState.selectedFlight;
        this.appState.map.focusOnFlight(latest);
        this.showToast(`📍 Carte centrée sur ${latest.flightNumber}`);
      }
    });

    // Left Sidebar: Simulate AR interception
    document.getElementById('det-simulate-ar-btn').addEventListener('click', () => {
      if (this.appState.selectedFlight) {
        this.appState.ar.start();
        // Calibrate yaw immediately onto the flight
        setTimeout(() => this.appState.ar.calibrateHeading(), 500);
      }
    });

    // Alerts Sidebar Toggler
    document.getElementById('alerts-toggle-btn').addEventListener('click', () => {
      this.toggleRightSidebar('alerts');
    });
    document.getElementById('close-alerts-btn').addEventListener('click', () => {
      this.toggleRightSidebar('');
    });

    // Airports Sidebar Toggler (Right)
    document.getElementById('close-airports-btn').addEventListener('click', () => {
      this.toggleRightSidebar('');
    });

    // Airport Tab Buttons
    const airportTabs = document.querySelectorAll('.airport-tab-btn');
    airportTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        airportTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const airportCode = tab.getAttribute('data-airport');
        this.currentAirportCode = airportCode;
        this.updateAirportStatsPanel();
        
        // Focus 3D camera sweep on the selected airport coordinate
        const apData = AIRPORTS[airportCode];
        if (apData) {
          this.appState.map.focusOnAirport(apData);
        }
      });
    });

    // Bottom Navigation Buttons
    document.getElementById('toggle-airports-btn').addEventListener('click', () => {
      this.toggleRightSidebar('airports');
    });

    document.getElementById('toggle-history-btn').addEventListener('click', () => {
      this.toggleBottomPanel('history');
    });

    document.getElementById('toggle-military-radar-btn').addEventListener('click', () => {
      this.toggleBottomPanel('tactical');
    });

    document.getElementById('close-bottom-panel-btn').addEventListener('click', () => {
      this.toggleBottomPanel('');
    });

    // Emergency Banner Buttons
    document.getElementById('emergency-focus-btn').addEventListener('click', () => {
      // Try each alert to find an active flight
      let foundFlight = null;
      for (const alert of this.appState.simulation.alerts) {
        foundFlight = this.appState.simulation.flights.find(f => f.id === alert.flightId);
        if (foundFlight) break;
      }
      if (foundFlight) {
        this.selectFlight(foundFlight);
        this.appState.map.focusOnFlight(foundFlight);
        document.getElementById('emergency-banner').classList.add('hidden');
      } else {
        this.showToast("Le vol en urgence a quitté le secteur radar.");
        document.getElementById('emergency-banner').classList.add('hidden');
      }
    });

    document.getElementById('emergency-close-btn').addEventListener('click', () => {
      document.getElementById('emergency-banner').classList.add('hidden');
    });

    // AR Exit Button
    document.getElementById('ar-exit-btn').addEventListener('click', () => {
      this.appState.ar.stop();
    });

    // AR Camera toggle
    document.getElementById('ar-toggle-camera-btn').addEventListener('click', () => {
      this.appState.ar.toggleCameraMode();
    });

    // AR Calibrate Gyro
    document.getElementById('ar-calibrate-btn').addEventListener('click', () => {
      this.appState.ar.calibrateHeading();
    });

    // AR Instructions close
    document.getElementById('ar-instructions-close-btn').addEventListener('click', () => {
      document.getElementById('ar-instructions-modal').classList.add('hidden');
    });

    // Geolocation click
    const geolocateBtn = document.getElementById('geolocate-btn');
    if (geolocateBtn) {
      geolocateBtn.addEventListener('click', () => {
        this.handleGeolocation();
      });
    }

    // Global mute sound button click
    const muteBtn = document.getElementById('mute-sound-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.toggleSoundMute();
      });
    }

    // Emergency banner mute/silence button click
    const emgMuteBtn = document.getElementById('emergency-mute-btn');
    if (emgMuteBtn) {
      emgMuteBtn.addEventListener('click', () => {
        this.toggleSoundMute(true); // force mute
        document.getElementById('emergency-banner').classList.add('hidden');
      });
    }

    // Collapsible Header Logic (Mobile/iPhone only)
    document.addEventListener('click', (e) => {
      // Only run on mobile viewport
      if (window.innerWidth > 900) return;
      
      const header = document.getElementById('main-header');
      if (!header) return;
      
      const isMapClick = e.target.id === 'map' || e.target.classList.contains('leaflet-container') || e.target.closest('.leaflet-container');
      
      if (isMapClick) {
        // Collapse header when clicking on the map
        header.classList.add('collapsed-header');
        document.body.classList.add('has-collapsed-header');
      } else if (header.contains(e.target)) {
        // Expand header when clicking anywhere on the header itself
        header.classList.remove('collapsed-header');
        document.body.classList.remove('has-collapsed-header');
      }
    });
  }

  // --- Internal helper: close sidebars without touching selected flight ---
  _closeSidebarsOnly() {
    const alertsSidebar = document.getElementById('alerts-sidebar');
    const airportsSidebar = document.getElementById('airports-sidebar');
    const bottomNavButtons = document.querySelectorAll('.bottom-nav-btn');
    alertsSidebar.classList.remove('open');
    airportsSidebar.classList.remove('open');
    bottomNavButtons.forEach(btn => btn.classList.remove('active'));
  }

  // --- Flight Selection & Sidebar UI ---
  selectFlight(flight) {
    this.appState.selectedFlight = flight;
    
    // Close right sidebars and bottom panel without triggering deselectFlight recursion
    this._closeSidebarsOnly();
    const panel = document.getElementById('bottom-collapsible-panel');
    if (panel) panel.classList.remove('open-panel');
    this.activeBottomTab = '';

    // Toggle Left Sidebar
    const sidebar = document.getElementById('flight-details-sidebar');
    sidebar.classList.remove('closed');
    
    if (flight.isEmergency) {
      sidebar.classList.add('emg');
    } else {
      sidebar.classList.remove('emg');
    }

    // Update 2D markers highlighting
    this.appState.map.updateMarkers(this.appState.simulation.flights, flight.id, this.appState.filterCategory);

    // Update 3D radar highlighting if active
    if (this.appState.radar3d && this.appState.radar3d.isActive) {
      this.appState.radar3d.update3DAirspace(this.appState.simulation.flights, flight.id, this.appState.filterCategory);
    }

    // Refresh details
    this.updateFlightDetailsPanel(flight);
  }

  deselectFlight() {
    this.appState.selectedFlight = null;
    document.getElementById('flight-details-sidebar').classList.add('closed');
    const photoWrap = document.getElementById('det-aircraft-photo-wrap');
    if (photoWrap) {
      photoWrap._currentFlightId = null;
      photoWrap.classList.add('hidden');
    }
    if (this.appState.map && this.appState.map.map) {
      this.appState.map.updateMarkers(this.appState.simulation.flights, null, this.appState.filterCategory);
    }
    if (this.appState.radar3d && this.appState.radar3d.isActive) {
      this.appState.radar3d.update3DAirspace(this.appState.simulation.flights, null, this.appState.filterCategory);
    }
  }

  updateFlightDetailsPanel(flight) {
    if (!flight) return;

    // Airline logo / code
    const airlineCode = flight.airline?.code || flight.flightNumber?.slice(0, 2) || '??';
    document.getElementById('det-airline-logo').innerText = airlineCode;
    
    // Core identifiers
    document.getElementById('det-flight-number').innerText = flight.flightNumber || flight.callsign || flight.icao24 || '???';
    document.getElementById('det-airline-name').innerText = flight.airline?.name || 'Compagnie inconnue';
    document.getElementById('det-flight-category').innerText = flight.category || 'CIVIL';

    // Real Aircraft Photo (Curated HD Livery + Dynamic Spotter Upgrade)
    const photoWrap = document.getElementById('det-aircraft-photo-wrap');
    const photoImg = document.getElementById('det-aircraft-photo');
    const photoLoading = document.getElementById('det-aircraft-photo-loading');
    const photoCredit = document.getElementById('det-aircraft-credit');
    const photoTag = document.getElementById('det-photo-tag');

    if (photoWrap) {
      const currentFlightId = flight.id;
      if (photoWrap._currentFlightId !== currentFlightId) {
        photoWrap._currentFlightId = currentFlightId;
        photoWrap.classList.remove('hidden');

        // 1. Instantly display curated authentic livery photo (0ms latency, guaranteed)
        const curated = resolveCuratedAircraftPhoto(flight);
        photoImg.src = curated.file;
        photoImg.alt = `${curated.model} - ${curated.airline}`;
        photoImg.classList.remove('hidden');
        if (photoLoading) photoLoading.classList.add('hidden');

        if (photoCredit) {
          photoCredit.innerHTML = `<a href="${curated.sourceUrl}" target="_blank" rel="noopener">© ${curated.photographer}</a>`;
        }
        if (photoTag) {
          photoTag.innerHTML = `<i data-lucide="camera"></i> ${curated.tag}`;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Safety fallback if an image fails to load
        photoImg.onerror = () => {
          if (photoImg.src !== curated.file) {
            photoImg.src = curated.file;
          }
        };

        // 2. Asynchronous background upgrade: try Wikimedia Commons for exact registration
        fetchDynamicAircraftPhoto(flight).then(dynamicPhoto => {
          if (photoWrap._currentFlightId !== currentFlightId) return;
          if (dynamicPhoto && dynamicPhoto.file) {
            photoImg.src = dynamicPhoto.file;
            if (photoCredit) {
              photoCredit.innerHTML = `<a href="${dynamicPhoto.sourceUrl}" target="_blank" rel="noopener">© ${dynamicPhoto.photographer}</a>`;
            }
            if (photoTag) {
              photoTag.innerHTML = `<i data-lucide="aperture"></i> ${dynamicPhoto.tag}`;
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
          }
        }).catch(() => {
          // Curated photo is already active and displayed
        });
      }
    }


    // Route — show what we know, otherwise indicate local VFR / unfiled flight plan
    const origCode = flight.origin?.code || 'N/A';
    const destCode = flight.destination?.code || 'N/A';
    document.getElementById('det-origin-code').innerText = origCode;
    document.getElementById('det-origin-name').innerText = (origCode !== 'N/A' && (AIRPORTS[origCode]?.name || flight.origin?.name)) || 'Vol local / VFR';
    document.getElementById('det-dest-code').innerText = destCode;
    document.getElementById('det-dest-name').innerText = (destCode !== 'N/A' && (AIRPORTS[destCode]?.name || flight.destination?.name)) || 'Plan non déposé';

    // Route progress bar (use calculated progress if route known, or neutral indicator)
    const progBar = document.getElementById('det-route-progress-bar');
    const progPercentEl = document.getElementById('det-progress-percent');
    if (flight.progress !== null && flight.progress !== undefined) {
      const progressPercent = Math.round(flight.progress * 100);
      if (progBar) progBar.style.left = `${Math.min(95, Math.max(5, progressPercent))}%`;
      if (progPercentEl) progPercentEl.innerText = `${progressPercent}%`;
    } else {
      if (progBar) progBar.style.left = '50%';
      if (progPercentEl) progPercentEl.innerText = 'En route';
    }

    // Times (live data shows current real timestamp)
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('det-departure-time').innerText = flight.isLive ? '—' : '10:45';
    document.getElementById('det-arrival-time').innerText = flight.isLive ? now : '14:20';

    // --- ALTITUDE (primary: meters, secondary: feet) ---
    const altM = flight.altitudeM ?? Math.round((flight.altitude || 0) * 0.3048);
    const altFt = flight.altitude ?? Math.round((flight.altitudeM || 0) * 3.28084);
    document.getElementById('det-altitude').innerText = `${altM.toLocaleString()} m`;
    
    const vRate = Math.round(flight.verticalSpeed || 0);
    const vRateEl = document.getElementById('det-vertical-rate');
    if (vRate > 150) {
      vRateEl.innerText = `↑ +${vRate} ft/min (${Math.round(vRate * 0.00508)} m/s)`;
      vRateEl.className = 'sub-val text-teal';
    } else if (vRate < -150) {
      vRateEl.innerText = `↓ ${vRate} ft/min (${Math.round(vRate * 0.00508)} m/s)`;
      vRateEl.className = 'sub-val emergency-text';
    } else {
      vRateEl.innerText = `→ ${altFt.toLocaleString()} ft / Croisière`;
      vRateEl.className = 'sub-val';
    }

    // Speed (KM/H primary, Knots secondary)
    document.getElementById('det-speed').innerText = `${Math.round((flight.speed || 0) * 1.852)} km/h`;
    document.getElementById('det-speed-kmh').innerText = `${Math.round(flight.speed || 0)} kts`;

    // Heading
    const heading = Math.round(flight.heading || 0);
    document.getElementById('det-heading').innerText = `${heading}°`;
    let headingText = 'Nord';
    if (heading >= 22.5 && heading < 67.5) headingText = 'Nord-Est';
    else if (heading >= 67.5 && heading < 112.5) headingText = 'Est';
    else if (heading >= 112.5 && heading < 157.5) headingText = 'Sud-Est';
    else if (heading >= 157.5 && heading < 202.5) headingText = 'Sud';
    else if (heading >= 202.5 && heading < 247.5) headingText = 'Sud-Ouest';
    else if (heading >= 247.5 && heading < 292.5) headingText = 'Ouest';
    else if (heading >= 292.5 && heading < 337.5) headingText = 'Nord-Ouest';
    document.getElementById('det-heading-text').innerText = headingText;

    // Squawk
    document.getElementById('det-squawk').innerText = flight.squawk || '????';
    const squawkStatusEl = document.getElementById('det-squawk-status');
    if (flight.isEmergency) {
      squawkStatusEl.innerText = flight.emergencyType || 'URGENCE';
      squawkStatusEl.className = 'sub-val emergency-text';
    } else {
      squawkStatusEl.innerText = 'Normal / Actif';
      squawkStatusEl.className = 'sub-val text-teal';
    }

    // Metadata — show ALL available ADS-B fields
    document.getElementById('det-aircraft-model').innerText = flight.aircraftModel || flight.t || 'Type inconnu';
    document.getElementById('det-aircraft-reg').innerText = flight.registration || flight.r || 'N/A';
    document.getElementById('det-coordinates').innerText = `${(flight.lat || 0).toFixed(5)}, ${(flight.lng || 0).toFixed(5)}`;

    // Extended ADS-B info block
    const extEl = document.getElementById('det-extended-info');
    if (extEl) {
      const rows = [
        ['Code ICAO 24', (flight.icao24 || flight.id || '').toUpperCase()],
        ['Pays', flight.country || flight.airline?.country || '—'],
        ['Opérateur / Armateur', flight.ownerOp || flight.airline?.name || '—'],
        ['Année de construction', flight.year || '—'],
        ['Description type', flight.desc || flight.aircraftModel || '—'],
        ['Statut', flight.onGround ? '🛑 Au sol' : `✈️ En vol — ${altM.toLocaleString()} m`],
        ['Source', flight._source || '📡 Transpondeur ADS-B Temps Réel'],
        ...(flight.rssi !== null && flight.rssi !== undefined ? [['Signal RSSI', `${flight.rssi} dBFS`]] : []),
        ...(flight.messages ? [['Messages reçus', flight.messages.toLocaleString()]] : []),
      ];

      extEl.innerHTML = rows.map(([label, val]) =>
        `<div class="meta-row">
          <span class="lbl">${label}</span>
          <span class="val">${val}</span>
        </div>`
      ).join('');
    }
  }

  // --- Right Sidebars Navigation (Alerts / Airports) ---
  toggleRightSidebar(type) {
    // Close the left flight details sidebar without recursion
    this.deselectFlight();

    // Reset right sidebars
    this._closeSidebarsOnly();

    if (type === 'alerts') {
      document.getElementById('alerts-sidebar').classList.add('open');
      document.getElementById('alerts-toggle-btn').classList.add('active');
      this.renderAlertsSidebar();
      
      // Hide badge once read
      document.getElementById('alerts-badge').classList.add('hidden');
    } else if (type === 'airports') {
      document.getElementById('airports-sidebar').classList.add('open');
      document.getElementById('toggle-airports-btn').classList.add('active');
      this.updateAirportStatsPanel();
    }
  }

  renderAlertsSidebar() {
    const listEl = document.getElementById('alerts-list');
    listEl.innerHTML = '';

    // Filter alerts to only those whose flight is visible within the map zoom bounds
    const alerts = this.appState.simulation.alerts.filter(alt => {
      const flight = this.appState.simulation.flights.find(f => f.id === alt.flightId);
      return flight && this.appState.map && this.appState.map.isFlightInView(flight);
    });

    // Keep badge synchronized with visible alerts
    const badge = document.getElementById('alerts-badge');
    if (badge) {
      badge.innerText = alerts.length;
      if (alerts.length > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (alerts.length === 0) {
      listEl.innerHTML = '<div class="no-alerts">Aucune alerte active dans le secteur affiché.</div>';
      return;
    }

    alerts.forEach(alt => {
      const card = document.createElement('div');
      const isSquawk77 = alt.type === 'SQUAWK 7700';
      card.className = `alert-card-item ${isSquawk77 ? 'emg' : ''}`;
      
      card.innerHTML = `
        <div class="alert-card-icon">
          <i data-lucide="${isSquawk77 ? 'alert-octagon' : 'wifi-off'}"></i>
        </div>
        <div class="alert-card-info">
          <h4>${alt.type} — ${alt.flightNumber}</h4>
          <p>${alt.message}</p>
          <div class="alert-card-time">${alt.timestamp}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        const flight = this.appState.simulation.flights.find(f => f.id === alt.flightId);
        if (flight) {
          this.selectFlight(flight);
          this.appState.map.focusOnFlight(flight);
        } else {
          this.showToast("Le vol a quitté le secteur radar.");
        }
      });

      listEl.appendChild(card);
    });

    // Make lucide icons render
    lucide.createIcons();
  }

  async updateAirportStatsPanel() {
    const code = this.currentAirportCode;
    const apData = AIRPORTS[code] || AIRPORTS.CDG;

    // Core Title
    document.getElementById('airport-fullname').innerText = apData.name;
    document.getElementById('airport-city').innerText = `${apData.city}, ${apData.country}`;

    // Fetch REAL weather from cache or Open-Meteo
    const currentTimeMs = Date.now();
    const cached = this.weatherCache.get(code);
    let wx = null;
    
    if (cached && (currentTimeMs - cached.timestamp < 300000)) { // 5-minute cache TTL
      wx = cached.data;
    } else {
      // Show placeholder during real fetch only to avoid screen flashing
      document.getElementById('airport-temp').innerText = 'Chargement...';
      document.getElementById('airport-wind').innerText = 'Vent: ...';
      wx = await fetchAirportWeather(code, apData.lat, apData.lng);
      if (wx) {
        this.weatherCache.set(code, { data: wx, timestamp: currentTimeMs });
      }
    }

    if (wx) {
      const tempStr = `${wx.tempC}°C`;
      const feelsStr = `(ressenti ${wx.feelsLike}°C)`;
      document.getElementById('airport-temp').innerText = `${tempStr} ${feelsStr}`;
      document.getElementById('airport-wind').innerText =
        `Vent: ${windDirToCompass(wx.windDir)} ${wx.windDir}° @ ${wx.windSpeedKmh} km/h — ${wx.description}`;
      
      // Dynamic weather icon
      const weatherIcon = document.getElementById('airport-weather-icon');
      weatherIcon.setAttribute('data-lucide', wx.conditionIcon);
      lucide.createIcons();
      
      // Extra weather details (humidity, pressure)
      const extRow = document.getElementById('airport-weather-extra');
      if (extRow) {
        extRow.innerText = `💧 Humidité: ${wx.humidity}% · 🔵 Pression: ${wx.pressure} hPa · Mis à jour: ${wx.fetchedAt}`;
      }
    } else {
      document.getElementById('airport-temp').innerText = 'Données météo indisponibles';
      document.getElementById('airport-wind').innerText = 'Vérifiez votre connexion réseau';
    }

    // Delay Index Rating Gauge Circle animation
    // Circle length = 2 * PI * r = 2 * 3.14 * 40 = 251.2
    // Compute delay index from real data: count aircraft within 50km of airport
    const allFlights = this.appState.simulation.flights;
    const nearbyFlights = allFlights.filter(f => {
      const dlat = f.lat - apData.lat;
      const dlng = f.lng - apData.lng;
      const distDeg = Math.sqrt(dlat*dlat + dlng*dlng);
      return distDeg < 0.5; // ~55km radius around airport
    });
    
    // Compute a dynamic delay index based on traffic density (real data)
    const dynamicDelayIndex = Math.min(9.9, nearbyFlights.length * 0.8);
    const displayDelayIndex = this.appState.simulation.mode === 'live'
      ? dynamicDelayIndex
      : (apData.delayIndex || 1.5);
    
    const dashoffset = 251.2 - (displayDelayIndex / 10.0) * 251.2;
    const gaugeCircle = document.getElementById('airport-delay-gauge');
    gaugeCircle.style.strokeDashoffset = dashoffset;
    
    if (displayDelayIndex > 5.0) {
      gaugeCircle.style.stroke = 'var(--color-emergency)';
    } else if (displayDelayIndex > 2.5) {
      gaugeCircle.style.stroke = 'var(--color-warning)';
    } else {
      gaugeCircle.style.stroke = 'var(--color-primary)';
    }

    document.getElementById('airport-delay-index').innerText = displayDelayIndex.toFixed(1);
    
    // Average delay values (computed from real traffic density)
    const arrDelay = Math.round(displayDelayIndex * 5);
    const depDelay = Math.round(displayDelayIndex * 7);
    document.getElementById('airport-arr-delay').innerText = `${arrDelay} min`;
    document.getElementById('airport-dep-delay').innerText = `${depDelay} min`;

    // Arrivals: match explicit destination airport OR incoming aircraft on final/approach
    const arrivals = allFlights
      .filter(f => {
        const isDestMatch = f.destination && (f.destination.code === code || f.destination.iata === code);
        if (isDestMatch) return true;
        
        // Secondary: physical inbound heading within 150km
        const dlat = apData.lat - f.lat;
        const dlng = apData.lng - f.lng;
        const distDeg = Math.sqrt(dlat*dlat + dlng*dlng);
        if (distDeg > 1.5) return false; // max ~165km
        const bearing = (Math.atan2(dlng, dlat) * 180 / Math.PI + 360) % 360;
        const hdgDiff = Math.abs(((f.heading - bearing) + 180 + 360) % 360 - 180);
        return hdgDiff < 45 && f.verticalSpeed <= 100;
      })
      .sort((a, b) => {
        const da = Math.hypot(a.lat - apData.lat, a.lng - apData.lng);
        const db = Math.hypot(b.lat - apData.lat, b.lng - apData.lng);
        return da - db;
      });

    // Departures: match explicit origin airport OR aircraft climbing away within 90km
    const departures = allFlights
      .filter(f => {
        const isOrgMatch = f.origin && (f.origin.code === code || f.origin.iata === code);
        if (isOrgMatch) return true;

        const dlat = apData.lat - f.lat;
        const dlng = apData.lng - f.lng;
        const distDeg = Math.sqrt(dlat*dlat + dlng*dlng);
        if (distDeg > 0.85 || distDeg < 0.01) return false; // within ~95km
        const bearing = (Math.atan2(-dlng, -dlat) * 180 / Math.PI + 360) % 360;
        const hdgDiff = Math.abs(((f.heading - bearing) + 180 + 360) % 360 - 180);
        return hdgDiff < 55 && f.verticalSpeed >= 50;
      })
      .sort((a, b) => {
        const da = Math.hypot(a.lat - apData.lat, a.lng - apData.lng);
        const db = Math.hypot(b.lat - apData.lat, b.lng - apData.lng);
        return da - db;
      });

    document.getElementById('airport-arrivals-count').innerText = arrivals.length;
    document.getElementById('airport-departures-count').innerText = departures.length;

    const now = new Date();
    const fmtTime = (f) => {
      // Estimate ETA: distance / speed
      const distKm = Math.hypot(f.lat - apData.lat, f.lng - apData.lng) * 111;
      const etaMin = f.speed > 0 ? Math.round(distKm / (f.speed * 1.852 / 60)) : '?';
      const eta = new Date(now.getTime() + etaMin * 60000);
      return isNaN(eta) ? '--:--' : eta.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    // Render arrivals rows
    const arrListEl = document.getElementById('airport-arrivals-list');
    arrListEl.innerHTML = '';
    
    if (arrivals.length === 0) {
      arrListEl.innerHTML = '<div class="no-alerts" style="padding:10px 0">Aucune arrivée détectée en approche.</div>';
    } else {
      arrivals.slice(0, 6).forEach(arr => {
        const distKm = Math.round(Math.hypot(arr.lat - apData.lat, arr.lng - apData.lng) * 111);
        const origLabel = (arr.origin?.code && arr.origin.code !== 'N/A') ? arr.origin.code : '';
        const row = document.createElement('div');
        row.className = 'queue-flight-row';
        row.innerHTML = `
          <span class="q-flight-nr">${arr.flightNumber || arr.callsign}</span>
          <span class="q-flight-route">${origLabel ? origLabel + ' ➔ ' : ''}${distKm} km</span>
          <span class="q-flight-time">${fmtTime(arr)}</span>
          <span class="q-flight-status ${distKm < 25 ? 'landed' : 'ontime'}">
            ${distKm < 25 ? 'FINALE' : (distKm < 60 ? 'APPROCHE' : 'EN ROUTE')}
          </span>
        `;
        row.addEventListener('click', () => {
          this.selectFlight(arr);
          this.appState.map.focusOnFlight(arr);
          this._closeSidebarsOnly();
        });
        arrListEl.appendChild(row);
      });
    }

    // Render departures rows
    const depListEl = document.getElementById('airport-departures-list');
    depListEl.innerHTML = '';
    
    if (departures.length === 0) {
      depListEl.innerHTML = '<div class="no-alerts" style="padding:10px 0">Aucun départ détecté à proximité.</div>';
    } else {
      departures.slice(0, 6).forEach(dep => {
        const distKm = Math.round(Math.hypot(dep.lat - apData.lat, dep.lng - apData.lng) * 111);
        const destLabel = (dep.destination?.code && dep.destination.code !== 'N/A') ? dep.destination.code : '';
        const row = document.createElement('div');
        row.className = 'queue-flight-row';
        row.innerHTML = `
          <span class="q-flight-nr">${dep.flightNumber || dep.callsign}</span>
          <span class="q-flight-route">${destLabel ? '➔ ' + destLabel : Math.round(dep.heading) + '°'} (${distKm} km)</span>
          <span class="q-flight-time">${Math.round(dep.altitudeM || (dep.altitude * 0.3048))} m</span>
          <span class="q-flight-status ontime">${dep.verticalSpeed > 200 ? 'MONTÉE' : 'DÉCOLLÉ'}</span>
        `;
        row.addEventListener('click', () => {
          this.selectFlight(dep);
          this.appState.map.focusOnFlight(dep);
          this._closeSidebarsOnly();
        });
        depListEl.appendChild(row);
      });
    }

    lucide.createIcons();
  }

  // --- Bottom Collapsible Dashboard Panel ---
  toggleBottomPanel(tab) {
    const panel = document.getElementById('bottom-collapsible-panel');
    const bottomNavButtons = document.querySelectorAll('.bottom-nav-btn');

    // Reset styles
    panel.classList.remove('open-panel');
    bottomNavButtons.forEach(btn => btn.classList.remove('active'));

    // Close right sidebars without recursion through deselectFlight
    this._closeSidebarsOnly();

    if (tab === this.activeBottomTab || tab === '') {
      this.activeBottomTab = '';
      return;
    }

    this.activeBottomTab = tab;
    panel.classList.add('open-panel');

    if (tab === 'history') {
      document.getElementById('toggle-history-btn').classList.add('active');
      document.getElementById('bottom-panel-title').innerText = 'Historique des vols du secteur (24h)';
      this.renderHistoryPanel();
    } else if (tab === 'tactical') {
      document.getElementById('toggle-military-radar-btn').classList.add('active');
      document.getElementById('bottom-panel-title').innerText = 'Faisceau Tactique & Activité Militaire';
      this.renderTacticalAlertsPanel();
    }
  }

  renderHistoryPanel() {
    const bodyEl = document.getElementById('bottom-panel-content');
    bodyEl.innerHTML = '';

    const logs = this.appState.simulation.historicalLogs;

    const tableWrap = document.createElement('div');
    tableWrap.className = 'history-table-container';
    
    let tableHtml = `
      <div class="history-grid-header">
        <div>VOL</div>
        <div>COMPAGNIE / MODÈLE</div>
        <div>PROVENANCE / DEST.</div>
        <div>DURÉE</div>
        <div>DATE</div>
        <div>REPLAY</div>
      </div>
    `;

    logs.forEach(log => {
      tableHtml += `
        <div class="history-grid-row" data-id="${log.id}">
          <div class="hl-flight">${log.flightNumber}</div>
          <div>
            <div class="hl-company">${log.airlineName}</div>
            <div style="font-size:0.68rem;color:var(--color-text-muted)">${log.aircraftModel}</div>
          </div>
          <div class="hl-route">
            <span>${log.origin}</span>
            <i data-lucide="arrow-right" style="width:12px;height:12px"></i>
            <span>${log.destination}</span>
          </div>
          <div class="hl-duration">${log.duration}</div>
          <div class="hl-date">${log.date}</div>
          <div>
            <button class="hl-replay-btn" data-id="${log.id}">TRACER</button>
          </div>
        </div>
      `;
    });

    tableWrap.innerHTML = tableHtml;
    bodyEl.appendChild(tableWrap);

    // Event listener for replay buttons
    tableWrap.querySelectorAll('.hl-replay-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const log = logs.find(l => l.id === id);
        
        if (log) {
          // Focus 2D map on the route location quadrant
          this.appState.map.focusOnAirport({
            lat: log.routeHistory[0][0],
            lng: log.routeHistory[0][1]
          });
          
          this.showToast(`Tracé de trajectoire historique pour ${log.flightNumber}.`);
          this.toggleBottomPanel(''); // close panel
        }
      });
    });

    lucide.createIcons();
  }

  renderTacticalAlertsPanel() {
    const bodyEl = document.getElementById('bottom-panel-content');
    
    // Count stats strictly for flights currently in visible zoom bounds
    const visibleFlights = this.appState.map 
      ? this.appState.map.getVisibleFlights(this.appState.simulation.flights, 'all') 
      : this.appState.simulation.flights;

    const totalFlights = visibleFlights.length;
    const milCount = visibleFlights.filter(f => f.category === 'MILITARY').length;
    const prvCount = visibleFlights.filter(f => f.category === 'PRIVATE').length;
    const emgCount = visibleFlights.filter(f => f.isEmergency).length;

    bodyEl.innerHTML = `
      <div class="tactical-grid">
        <div class="tactical-card">
          <h4>Vecteurs Militaires Visibles</h4>
          <div class="tactical-metric">
            <span class="val" style="color: var(--color-accent-military)">${milCount}</span>
            <span class="lbl">Unités en patrouille</span>
          </div>
          <p style="font-size:0.75rem;color:var(--color-text-secondary)">Surveillance radar active sur le secteur affiché (${totalFlights} vols au zoom).</p>
        </div>
        <div class="tactical-card emg">
          <h4>Détresses Transpondeurs</h4>
          <div class="tactical-metric">
            <span class="val">${emgCount}</span>
            <span class="lbl">Urgence(s) à l'écran</span>
          </div>
          <p style="font-size:0.75rem;color:var(--color-text-secondary)">Surveillance prioritaire du code Squawk 7700 (détresse) et 7600 (perte radio).</p>
        </div>
        <div class="tactical-card">
          <h4>Vols VIP / d'Affaires Visibles</h4>
          <div class="tactical-metric">
            <span class="val" style="color: var(--color-accent-private)">${prvCount}</span>
            <span class="lbl">Jets privés</span>
          </div>
          <p style="font-size:0.75rem;color:var(--color-text-secondary)">Liaisons privées actives dans le champ de zoom.</p>
        </div>
      </div>
    `;
  }

  // --- Real-time Notifications & Alerts System ---
  triggerSquawkToast(alert) {
    // Technical alarms ONLY trigger if aircraft is inside current zoom view!
    const flight = this.appState.simulation.flights.find(f => f.id === alert.flightId);
    if (flight && this.appState.map && !this.appState.map.isFlightInView(flight)) {
      return;
    }

    // Show Top Emergency Banner
    const banner = document.getElementById('emergency-banner');
    const textEl = document.getElementById('emergency-text');
    
    textEl.innerText = alert.message;
    banner.classList.remove('hidden');

    // Highlight alert button badge for visible alerts only
    const badge = document.getElementById('alerts-badge');
    const visibleAlerts = this.appState.simulation.alerts.filter(alt => {
      const fl = this.appState.simulation.flights.find(f => f.id === alt.flightId);
      return fl && this.appState.map && this.appState.map.isFlightInView(fl);
    });
    const badgeCount = visibleAlerts.length;
    badge.innerText = badgeCount;
    if (badgeCount > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    // Play a subtle neon blinking effect on alerts bell icon
    const bellBtn = document.getElementById('alerts-toggle-btn');
    bellBtn.classList.add('emergency-text');
    setTimeout(() => bellBtn.classList.remove('emergency-text'), 5000);

    // Dynamic audio beep warning (synthesized via Web Audio API for high-tech premium feel!)
    this.synthesizeWarningBeep();

    this.showToast(`🚨 NOUVELLE ALERTE : ${alert.flightNumber} déclaré en urgence !`);
    
    // Refresh alerts list if open
    if (document.getElementById('alerts-sidebar').classList.contains('open')) {
      this.renderAlertsSidebar();
    }
  }

  synthesizeWarningBeep() {
    // 1. Check if sound notifications are muted
    if (this.appState.soundMuted) return;

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const playBeepNode = (frequency, duration, delayTime) => {
        setTimeout(() => {
          // Double check mute status before playing delayed note
          if (this.appState.soundMuted) return;

          const oscNode = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscNode.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscNode.type = 'sine';
          oscNode.frequency.setValueAtTime(frequency, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

          oscNode.start();
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
          
          // CRITICAL MEMORY/AUDIO FIX: Always call stop explicitly to release the oscillator resource!
          oscNode.stop(audioCtx.currentTime + duration + 0.05);
        }, delayTime);
      };

      // Play high-tech triple-pulse warning beep sequence
      playBeepNode(880, 0.15, 0);
      playBeepNode(880, 0.15, 250);
      playBeepNode(1100, 0.3, 500);

    } catch (e) {
      console.warn("Web Audio API warning beeps not supported", e);
    }
  }

  toggleSoundMute(forceMute = null) {
    if (forceMute !== null) {
      this.appState.soundMuted = forceMute;
    } else {
      this.appState.soundMuted = !this.appState.soundMuted;
    }

    const muteBtn = document.getElementById('mute-sound-btn');
    if (muteBtn) {
      if (this.appState.soundMuted) {
        muteBtn.innerHTML = '<i data-lucide="volume-x"></i>';
        muteBtn.title = 'Activer les sons d\'alertes';
        muteBtn.classList.add('muted');
        this.showToast("Alertes sonores désactivées.");
      } else {
        muteBtn.innerHTML = '<i data-lucide="volume-2"></i>';
        muteBtn.title = 'Couper les sons d\'alertes';
        muteBtn.classList.remove('muted');
        this.showToast("Alertes sonores activées.");
      }
      // Re-trigger Lucide icons rendering for the swapped icon
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  showToast(message) {
    // Custom floating clean toast
    const toast = document.createElement('div');
    toast.className = 'glass-panel';
    toast.style.position = 'fixed';
    toast.style.bottom = '85px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%) translateY(30px)';
    toast.style.padding = '10px 24px';
    toast.style.zIndex = '99999';
    toast.style.fontSize = '0.85rem';
    toast.style.fontWeight = '600';
    toast.style.borderLeft = '4px solid var(--color-primary)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.35s cubic-bezier(0.19, 1, 0.22, 1)';
    toast.style.pointerEvents = 'none';
    toast.innerText = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 50);

    // Fade out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // --- Interactive Search Controller ---
  handleSearch(query) {
    const resultsEl = document.getElementById('search-results');
    resultsEl.innerHTML = '';
    
    if (query.trim().length === 0) {
      resultsEl.classList.add('hidden');
      return;
    }

    const normQuery = query.toLowerCase().trim();
    const flights = this.appState.simulation.flights;

    // 1. Search for matching airports
    const matchedAirports = Object.values(AIRPORTS).filter(ap => {
      return ap.code.toLowerCase().includes(normQuery) ||
             ap.name.toLowerCase().includes(normQuery) ||
             ap.city.toLowerCase().includes(normQuery) ||
             ap.country.toLowerCase().includes(normQuery);
    });

    // 2. Search for flights (including callsign, registration, transponder hex, squawk, airports)
    const matchedFlights = flights.filter(f => {
      const origCode = f.origin?.code;
      const destCode = f.destination?.code;
      const origAp = (origCode && origCode !== 'N/A') ? AIRPORTS[origCode] : null;
      const destAp = (destCode && destCode !== 'N/A') ? AIRPORTS[destCode] : null;

      const flightNo = String(f.flightNumber || '').toLowerCase();
      const callsign = String(f.callsign || '').toLowerCase();
      const reg = String(f.registration || f.r || '').toLowerCase();
      const hex = String(f.icao24 || f.id || '').toLowerCase();
      const airlineName = String(f.airline?.name || '').toLowerCase();
      const model = String(f.aircraftModel || f.t || '').toLowerCase();
      const squawk = String(f.squawk || '').toLowerCase();
      
      return flightNo.includes(normQuery) ||
             callsign.includes(normQuery) ||
             reg.includes(normQuery) ||
             hex.includes(normQuery) ||
             airlineName.includes(normQuery) ||
             model.includes(normQuery) ||
             squawk.includes(normQuery) ||
             (origCode && origCode.toLowerCase().includes(normQuery)) ||
             (destCode && destCode.toLowerCase().includes(normQuery)) ||
             (origAp && (origAp.name.toLowerCase().includes(normQuery) || origAp.city.toLowerCase().includes(normQuery))) ||
             (destAp && (destAp.name.toLowerCase().includes(normQuery) || destAp.city.toLowerCase().includes(normQuery)));
    });

    resultsEl.classList.remove('hidden');

    if (matchedAirports.length === 0 && matchedFlights.length === 0) {
      resultsEl.innerHTML = '<div class="search-no-results">Aucun résultat ne correspond dans le secteur.</div>';
      return;
    }

    // Render airports matching the query
    matchedAirports.slice(0, 3).forEach(ap => {
      const div = document.createElement('div');
      div.className = 'search-item';
      
      div.innerHTML = `
        <div class="search-item-left">
          <span class="search-item-title" style="color: var(--color-secondary)"><i data-lucide="building-2" style="width:12px;height:12px;display:inline-block;margin-right:5px"></i>${ap.name} (${ap.code})</span>
          <span class="search-item-sub">${ap.city}, ${ap.country} — Index retard: ${ap.delayIndex}</span>
        </div>
        <span class="search-item-badge" style="color: var(--color-secondary); border-color: rgba(79, 172, 254, 0.2)">AÉROPORT</span>
      `;

      div.addEventListener('click', () => {
        this.currentAirportCode = ap.code;
        this.updateAirportStatsPanel();
        
        // Active airports panel right sidebar
        this.toggleRightSidebar('airports');
        
        // Highlight active airport tab button in sidebar
        const tabs = document.querySelectorAll('.airport-tab-btn');
        tabs.forEach(t => {
          if (t.getAttribute('data-airport') === ap.code) t.classList.add('active');
          else t.classList.remove('active');
        });

        this.appState.map.focusOnAirport(ap);
        resultsEl.classList.add('hidden');
        document.getElementById('search-input').value = '';
      });

      resultsEl.appendChild(div);
    });

    // Render flights matching the query
    matchedFlights.slice(0, 6).forEach(f => {
      const div = document.createElement('div');
      div.className = 'search-item';
      
      const catClass = f.category === 'MILITARY' ? 'mil' : (f.category === 'PRIVATE' ? 'prv' : 'civ');
      const catLabel = f.category === 'MILITARY' ? 'MILITAIRE' : (f.category === 'PRIVATE' ? 'PRIVÉ' : 'CIVIL');
      const airlineName = f.airline?.name || 'Inconnu';
      const flightTitle = f.flightNumber || f.callsign || f.registration || f.icao24;
      const routeText = (f.origin?.code && f.origin.code !== 'N/A' && f.destination?.code && f.destination.code !== 'N/A')
        ? `${f.origin.code} ✈ ${f.destination.code}`
        : 'Vol local / VFR';
      const regText = (f.registration && f.registration !== flightTitle) ? ` [${f.registration}]` : '';

      div.innerHTML = `
        <div class="search-item-left">
          <span class="search-item-title">${flightTitle}${regText} — ${airlineName}</span>
          <span class="search-item-sub">${f.aircraftModel || f.t || 'Appareil'} (${routeText})</span>
        </div>
        <span class="search-item-badge ${catClass}">${catLabel}</span>
      `;

      div.addEventListener('click', () => {
        this.selectFlight(f);
        this.appState.map.focusOnFlight(f);
        resultsEl.classList.add('hidden');
        document.getElementById('search-input').value = '';
      });

      resultsEl.appendChild(div);
    });

    lucide.createIcons();
  }

  handleGeolocation() {
    if (!navigator.geolocation) {
      this.showToast("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    // Visual feedback: animate the geolocate button
    const geoBtn = document.getElementById('geolocate-btn');
    if (geoBtn) geoBtn.classList.add('loading');
    this.showToast("📡 Accès GPS en cours...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (geoBtn) geoBtn.classList.remove('loading');

        // 1. Place a "you are here" marker on the map
        this.appState.userPos = { lat: latitude, lng: longitude };
        this.appState.map.setUserLocationMarker(latitude, longitude);

        // 2. Center 2D Map on user position
        this.appState.map.map.flyTo([latitude, longitude], 8, { animate: true, duration: 1.5 });

        // 3. Try to fetch live ADS-B data around user location first
        this.showToast("🛰️ Téléchargement des vols ADS-B autour de vous...");
        const liveSuccess = await this.appState.simulation.fetchAndApplyLiveStates(latitude, longitude);

        if (liveSuccess) {
          this.showToast(`✅ ${this.appState.simulation.flights.length} vols ADS-B réels détectés à proximité !`);
          const logoTag = document.querySelector('.logo-text .tag');
          if (logoTag) {
            logoTag.innerText = 'DIRECT ADS-B';
            logoTag.style.color = 'var(--color-primary)';
          }
        } else {
          // Fallback: generate simulated airspace around user
          this.appState.simulation.regenerateAirspaceAround(latitude, longitude);
          this.showToast("📡 Espace aérien simulé autour de votre position.");
        }

        // 4. Update the 2D plane markers and trails
        this.appState.map.updateMarkers(
          this.appState.simulation.flights,
          null,
          this.appState.filterCategory
        );
      },
      (error) => {
        if (geoBtn) geoBtn.classList.remove('loading');
        console.error("Geolocation error", error);
        let msg = "Impossible d'obtenir votre position GPS.";
        if (error.code === 1) msg = "Accès GPS refusé. Vérifiez les permissions du navigateur.";
        else if (error.code === 3) msg = "Délai GPS dépassé. Réessayez dans un moment.";
        this.showToast(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }
}
