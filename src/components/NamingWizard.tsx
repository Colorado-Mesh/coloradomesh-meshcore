"use client";

import { useState, useMemo } from "react";

// --- Data ---

const regionCodes = [
  { code: "ALS", city: "Alamosa", airport: "San Luis Valley Regional" },
  { code: "ASE", city: "Aspen", airport: "Aspen/Pitkin County" },
  { code: "CEZ", city: "Cortez", airport: "Cortez Municipal" },
  { code: "COS", city: "Colorado Springs", airport: "Colorado Springs Municipal" },
  { code: "DEN", city: "Denver", airport: "Denver International" },
  { code: "DRO", city: "Durango", airport: "Durango\u2013La Plata County" },
  { code: "EGE", city: "Eagle/Vail", airport: "Eagle County Regional" },
  { code: "FNL", city: "Fort Collins/Loveland", airport: "Northern Colorado Regional" },
  { code: "GJT", city: "Grand Junction", airport: "Grand Junction Regional" },
  { code: "GUC", city: "Gunnison", airport: "Gunnison\u2013Crested Butte Regional" },
  { code: "HDN", city: "Hayden/Steamboat", airport: "Yampa Valley" },
  { code: "MTJ", city: "Montrose", airport: "Montrose Regional" },
  { code: "PUB", city: "Pueblo", airport: "Pueblo Memorial" },
  { code: "TEX", city: "Telluride", airport: "Telluride Regional" },
];

const nodeTypes = [
  { code: "RC", label: "Core Repeater", description: "Backbone. Mountain/tower. Battery backup." },
  { code: "RD", label: "Distribution Repeater", description: "Bridges core to edge. Suburban elevated." },
  { code: "RE", label: "Edge Repeater", description: "Rooftop/residential. Mains power OK." },
  { code: "RM", label: "Mobile Repeater", description: "Vehicle or temporary." },
  { code: "TS", label: "Room Server", description: "Fixed location." },
  { code: "TM", label: "Mobile Room", description: "Location changes." },
  { code: "TR", label: "Room + Repeat", description: "Room server w/ repeat on." },
];

// City codes with full names for the dropdown
const knownCities: { code: string; name: string }[] = [
  { code: "AGLR", name: "Aguilar" },
  { code: "AKRON", name: "Akron" },
  { code: "ALMSA", name: "Alamosa" },
  { code: "ANTNR", name: "Antonito" },
  { code: "ARVDA", name: "Arvada" },
  { code: "ASPN", name: "Aspen" },
  { code: "AURRA", name: "Aurora" },
  { code: "AVON", name: "Avon" },
  { code: "BSLT", name: "Basalt" },
  { code: "BNNTT", name: "Bennett" },
  { code: "BRTHD", name: "Berthoud" },
  { code: "BOULR", name: "Boulder" },
  { code: "BRECK", name: "Breckenridge" },
  { code: "BRGTN", name: "Brighton" },
  { code: "BROOM", name: "Broomfield" },
  { code: "BRUSH", name: "Brush" },
  { code: "BVSTA", name: "Buena Vista" },
  { code: "CANON", name: "Canon City" },
  { code: "CRBDL", name: "Carbondale" },
  { code: "CSTLP", name: "Castle Pines" },
  { code: "CSTLR", name: "Castle Rock" },
  { code: "CENTL", name: "Centennial" },
  { code: "CENTR", name: "Center" },
  { code: "CHVLG", name: "Cherry Hills Village" },
  { code: "CSPRG", name: "Colorado Springs" },
  { code: "CMRCE", name: "Commerce City" },
  { code: "CNFR", name: "Conifer" },
  { code: "CRTZL", name: "Cortez" },
  { code: "CRAIG", name: "Craig" },
  { code: "CREED", name: "Creede" },
  { code: "CRSTB", name: "Crested Butte" },
  { code: "CRPCK", name: "Cripple Creek" },
  { code: "DACNO", name: "Dacono" },
  { code: "DLNRT", name: "Del Norte" },
  { code: "DELTA", name: "Delta" },
  { code: "DENVR", name: "Denver" },
  { code: "DLLNG", name: "Dillon" },
  { code: "DLRS", name: "Dolores" },
  { code: "DRNGO", name: "Durango" },
  { code: "EAGLE", name: "Eagle" },
  { code: "EATON", name: "Eaton" },
  { code: "EDGWR", name: "Edgewater" },
  { code: "EDWRD", name: "Edwards" },
  { code: "ENGL", name: "Englewood" },
  { code: "ERIE", name: "Erie" },
  { code: "ESTRK", name: "Estes Park" },
  { code: "EVANS", name: "Evans" },
  { code: "EVRGN", name: "Evergreen" },
  { code: "FRPLY", name: "Fairplay" },
  { code: "FDHTS", name: "Federal Heights" },
  { code: "FRSTM", name: "Firestone" },
  { code: "FLRNC", name: "Florence" },
  { code: "FNTNG", name: "Fountain" },
  { code: "FRDRK", name: "Frederick" },
  { code: "FRCLN", name: "Fort Collins" },
  { code: "FRTLP", name: "Fort Lupton" },
  { code: "FRTMR", name: "Fort Morgan" },
  { code: "FRSC", name: "Frisco" },
  { code: "FRUITA", name: "Fruita" },
  { code: "GRGRN", name: "Georgetown" },
  { code: "GLDAL", name: "Glendale" },
  { code: "GLNSP", name: "Glenwood Springs" },
  { code: "GLDN", name: "Golden" },
  { code: "GRNJN", name: "Grand Junction" },
  { code: "GRNBY", name: "Granby" },
  { code: "GRELY", name: "Greeley" },
  { code: "GRNWD", name: "Greenwood Village" },
  { code: "GNSN", name: "Gunnison" },
  { code: "HAYDN", name: "Hayden" },
  { code: "HGHLN", name: "Highlands Ranch" },
  { code: "HTCHK", name: "Hotchkiss" },
  { code: "HDSN", name: "Hudson" },
  { code: "IDSPG", name: "Idaho Springs" },
  { code: "IGNCO", name: "Ignacio" },
  { code: "JHNST", name: "Johnstown" },
  { code: "KNSB", name: "Keenesburg" },
  { code: "KIOWA", name: "Kiowa" },
  { code: "LAJNT", name: "La Junta" },
  { code: "LAVTA", name: "La Veta" },
  { code: "LFYTE", name: "Lafayette" },
  { code: "LKCTY", name: "Lake City" },
  { code: "LKWD", name: "Lakewood" },
  { code: "LAMAR", name: "Lamar" },
  { code: "LSANM", name: "Las Animas" },
  { code: "LDVL", name: "Leadville" },
  { code: "LIMON", name: "Limon" },
  { code: "LTTN", name: "Littleton" },
  { code: "LCHBR", name: "Lochbuie" },
  { code: "LNTRE", name: "Lone Tree" },
  { code: "LNGMT", name: "Longmont" },
  { code: "LSVL", name: "Louisville" },
  { code: "LVLND", name: "Loveland" },
  { code: "LYONS", name: "Lyons" },
  { code: "MNSSA", name: "Manassa" },
  { code: "MNTSP", name: "Manitou Springs" },
  { code: "MEAD", name: "Mead" },
  { code: "MLKN", name: "Milliken" },
  { code: "MNTRN", name: "Minturn" },
  { code: "MNMNT", name: "Monument" },
  { code: "MNTVS", name: "Monte Vista" },
  { code: "MNTRS", name: "Montrose" },
  { code: "MORSN", name: "Morrison" },
  { code: "NATRK", name: "Naturita" },
  { code: "NEDRL", name: "Nederland" },
  { code: "NWCST", name: "New Castle" },
  { code: "NRTHG", name: "Northglenn" },
  { code: "NRWOD", name: "Norwood" },
  { code: "OAKCK", name: "Oak Creek" },
  { code: "OLATHE", name: "Olathe" },
  { code: "OURAY", name: "Ouray" },
  { code: "PAGSA", name: "Pagosa Springs" },
  { code: "PALIS", name: "Palisade" },
  { code: "PLMRL", name: "Palmer Lake" },
  { code: "PAONA", name: "Paonia" },
  { code: "PARKR", name: "Parker" },
  { code: "PLTVL", name: "Platteville" },
  { code: "PNCHS", name: "Poncha Springs" },
  { code: "PUEBL", name: "Pueblo" },
  { code: "RNGLY", name: "Rangely" },
  { code: "RDGWY", name: "Ridgway" },
  { code: "RIFLE", name: "Rifle" },
  { code: "RKYFD", name: "Rocky Ford" },
  { code: "SGCHE", name: "Saguache" },
  { code: "SLIDA", name: "Salida" },
  { code: "SNLUS", name: "San Luis" },
  { code: "SVRNC", name: "Severance" },
  { code: "SHERD", name: "Sheridan" },
  { code: "SLVTM", name: "Silverthorne" },
  { code: "SLVRN", name: "Silverton" },
  { code: "SNMVL", name: "Snowmass Village" },
  { code: "STHFK", name: "South Fork" },
  { code: "STMBT", name: "Steamboat Springs" },
  { code: "STRLG", name: "Sterling" },
  { code: "SPERR", name: "Superior" },
  { code: "TLLRD", name: "Telluride" },
  { code: "THRTN", name: "Thornton" },
  { code: "TMNTH", name: "Timnath" },
  { code: "TRNDD", name: "Trinidad" },
  { code: "VAIL", name: "Vail" },
  { code: "VICTR", name: "Victor" },
  { code: "WLDEN", name: "Walden" },
  { code: "WLSNB", name: "Walsenburg" },
  { code: "WSTMR", name: "Westminster" },
  { code: "WHTRD", name: "Wheat Ridge" },
  { code: "WNDSB", name: "Windsor" },
  { code: "WNTRP", name: "Winter Park" },
  { code: "WDLPK", name: "Woodland Park" },
  { code: "WRAY", name: "Wray" },
  { code: "YUMA", name: "Yuma" },
];

const knownLandmarks: { code: string; name: string }[] = [
  { code: "16ST", name: "16th Street Mall" },
  { code: "USAFA", name: "Air Force Academy" },
  { code: "ANVLR", name: "Animas River" },
  { code: "BKRPR", name: "Baker Park" },
  { code: "BEAR", name: "Bear Creek" },
  { code: "BRKLY", name: "Berkeley" },
  { code: "BKVLY", name: "Blue River Valley" },
  { code: "BRDWY", name: "Broadway" },
  { code: "BRDHM", name: "Broadmoor" },
  { code: "CPHIL", name: "Cap Hill" },
  { code: "CSTLP", name: "Castlewood Canyon" },
  { code: "CHTSN", name: "Chatfield" },
  { code: "CHSPK", name: "Cheesman Park" },
  { code: "CHRRY", name: "Cherry Creek" },
  { code: "CHYMT", name: "Cheyenne Mountain" },
  { code: "CTYPR", name: "City Park" },
  { code: "CLFAX", name: "Colfax Avenue" },
  { code: "CNFPR", name: "Confluence Park" },
  { code: "CRKPR", name: "Cranmer Park" },
  { code: "DEERR", name: "Deer Creek" },
  { code: "DIA", name: "Denver Intl Airport" },
  { code: "DLLNG", name: "Dillon Reservoir" },
  { code: "ELDRG", name: "Eldorado Canyon" },
  { code: "ELYRA", name: "Elyria" },
  { code: "FXFLD", name: "Five Points" },
  { code: "FLTSN", name: "Flatirons" },
  { code: "GRDNP", name: "Garden of the Gods" },
  { code: "GLOBV", name: "Globeville" },
  { code: "GRNMT", name: "Green Mountain" },
  { code: "GRPRK", name: "Green Valley Ranch" },
  { code: "HMPDN", name: "Hampden" },
  { code: "HLNDL", name: "Highlands" },
  { code: "HRNSR", name: "Horsetooth Rock" },
  { code: "INDPN", name: "Independence Pass" },
  { code: "I70", name: "I-70 Corridor" },
  { code: "LKMAR", name: "Lake Marston" },
  { code: "LKVST", name: "Lookout Mountain" },
  { code: "LODO", name: "Lower Downtown" },
  { code: "LOWRY", name: "Lowry" },
  { code: "MNTON", name: "Manitou Springs" },
  { code: "MRSHL", name: "Marshall Mesa" },
  { code: "MERID", name: "Meridian" },
  { code: "MNTCL", name: "Montclair" },
  { code: "MORSN", name: "Mount Morrison" },
  { code: "NSTPR", name: "North Star" },
  { code: "PRLST", name: "Pearl Street" },
  { code: "PKSPK", name: "Pikes Peak" },
  { code: "RDRKS", name: "Red Rocks" },
  { code: "RINO", name: "RiNo Arts District" },
  { code: "RCKYM", name: "Rocky Mountain NP" },
  { code: "RUBY", name: "Ruby Hill" },
  { code: "RVLPK", name: "Roxborough Park" },
  { code: "SNTFE", name: "Santa Fe" },
  { code: "SLOAN", name: "Sloan\u2019s Lake" },
  { code: "SR+25", name: "Speer + I-25" },
  { code: "STPLT", name: "Stapleton/CLT" },
  { code: "STNPK", name: "Standley Lake" },
  { code: "SWNSN", name: "Swansea" },
  { code: "TABMN", name: "Table Mountain" },
  { code: "TECTR", name: "Tech Center" },
  { code: "UNION", name: "Union Station" },
  { code: "WSHPK", name: "Washington Park" },
  { code: "WTRTN", name: "Waterton Canyon" },
];

// --- Component ---

export default function NamingWizard() {
  const [region, setRegion] = useState("");
  const [cityMode, setCityMode] = useState<"known" | "custom">("known");
  const [cityCode, setCityCode] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [skipCity, setSkipCity] = useState(false);
  const [landmarkMode, setLandmarkMode] = useState<"known" | "custom">("custom");
  const [landmarkCode, setLandmarkCode] = useState("");
  const [customLandmark, setCustomLandmark] = useState("");
  const [landmarkSearch, setLandmarkSearch] = useState("");
  const [nodeType, setNodeType] = useState("");
  const [pubkey, setPubkey] = useState("");
  const [copied, setCopied] = useState(false);

  const city = cityMode === "known" ? cityCode : customCity.toUpperCase();

  const filteredCities = useMemo(() => {
    if (!citySearch) return knownCities;
    const q = citySearch.toLowerCase();
    return knownCities.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [citySearch]);

  const filteredLandmarks = useMemo(() => {
    if (!landmarkSearch) return knownLandmarks;
    const q = landmarkSearch.toLowerCase();
    return knownLandmarks.filter(
      (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [landmarkSearch]);
  const landmark = landmarkMode === "known" ? landmarkCode : customLandmark.toUpperCase();

  const generatedName = useMemo(() => {
    const parts: string[] = [];
    if (region) parts.push(region);
    if (!skipCity && city) parts.push(city);
    if (landmark) parts.push(landmark);
    if (nodeType) parts.push(nodeType);
    if (pubkey) parts.push(pubkey.toUpperCase());
    return parts.join("-");
  }, [region, city, skipCity, landmark, nodeType, pubkey]);

  const charCount = generatedName.length;
  const isOverLimit = charCount > 23;
  const isComplete = region && (skipCity || city) && landmark && nodeType && pubkey.length === 4;

  // Validation
  const landmarkMaxLen = skipCity ? 11 : 5;
  const cityValid = skipCity || (city.length >= 1 && city.length <= 5 && /^[A-Z]+$/.test(city));
  const landmarkValid = landmark.length >= 1 && landmark.length <= landmarkMaxLen && /^[A-Z0-9.+_|]+$/.test(landmark);
  const pubkeyValid = /^[A-Fa-f0-9]{4}$/.test(pubkey);

  const errors: string[] = [];
  if (city && !skipCity && !cityValid) errors.push("City must be 1\u20135 letters only");
  if (landmark && !landmarkValid) errors.push(`Landmark must be 1\u2013${landmarkMaxLen} chars (A-Z, 0-9, +, ., _, |)`);
  if (pubkey && !pubkeyValid) errors.push("Pub key must be exactly 4 hex chars (0-9, A-F)");
  if (isOverLimit) errors.push("Name exceeds 23-character limit");

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div className="card-mesh p-6 text-center">
        <p className="text-xs text-foreground-muted uppercase tracking-wider mb-2">Generated Name</p>
        <p className={`font-mono text-2xl md:text-3xl font-bold ${isOverLimit ? 'text-red-500' : generatedName ? 'text-mesh' : 'text-foreground-muted'}`}>
          {generatedName || "DEN-DNVR-CHSPK-RC-9F2E"}
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className={`text-sm font-mono ${isOverLimit ? 'text-red-500 font-bold' : 'text-foreground-muted'}`}>
            {charCount}/23 chars
          </span>
          {isComplete && !isOverLimit && errors.length === 0 && (
            <button
              onClick={handleCopy}
              className="btn-accent text-sm px-4 py-1.5 inline-flex items-center gap-2"
            >
              {copied ? "Copied!" : "Copy"}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                )}
              </svg>
            </button>
          )}
        </div>
        {errors.length > 0 && (
          <div className="mt-3 space-y-1">
            {errors.map((e, i) => (
              <p key={i} className="text-red-500 text-xs">{e}</p>
            ))}
          </div>
        )}
      </div>

      {/* Format Reference */}
      <div className="card-mesh p-4 bg-night-800/20">
        <p className="font-mono text-sm text-center text-foreground-muted">
          <span className={region ? "text-mesh" : ""}>[REGION]</span>
          <span>-</span>
          <span className={!skipCity && city ? "text-mesh" : skipCity ? "line-through opacity-50" : ""}>[CITY]</span>
          <span className={skipCity ? "opacity-50" : ""}>-</span>
          <span className={landmark ? "text-mesh" : ""}>[LANDMARK]</span>
          <span>-</span>
          <span className={nodeType ? "text-mesh" : ""}>[TYPE]</span>
          <span>-</span>
          <span className={pubkey ? "text-mesh" : ""}>[PUBKEY]</span>
        </p>
      </div>

      {/* Step 1: Region */}
      <div className="card-mesh p-6">
        <label className="block text-sm font-semibold text-foreground mb-1">
          <span className="text-mountain-500 mr-2">1.</span>Region (IATA Airport Code)
        </label>
        <p className="text-xs text-foreground-muted mb-3">Select the nearest commercial airport to your node location.</p>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono focus:ring-2 focus:ring-mesh focus:border-mesh outline-none"
        >
          <option value="">Select region...</option>
          {regionCodes.map((r) => (
            <option key={r.code} value={r.code}>
              {r.code} — {r.city} ({r.airport})
            </option>
          ))}
        </select>
        <p className="text-xs text-foreground-muted mt-2">
          Not sure?{" "}
          <a href="https://www.travelmath.com/nearest-airport/" target="_blank" rel="noopener noreferrer" className="text-mesh hover:text-mesh-light">
            Find your nearest airport
          </a>
        </p>
      </div>

      {/* Step 2: City */}
      <div className="card-mesh p-6">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-semibold text-foreground">
            <span className="text-mountain-500 mr-2">2.</span>City
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer">
            <input
              type="checkbox"
              checked={skipCity}
              onChange={(e) => setSkipCity(e.target.checked)}
              className="rounded border-card-border text-mesh focus:ring-mesh"
            />
            Skip (prominent landmark)
          </label>
        </div>
        <p className="text-xs text-foreground-muted mb-3">
          {skipCity
            ? "City skipped \u2014 landmark can be up to 11 characters."
            : "1\u20135 letters. Pick from known codes or type your own."}
        </p>
        {!skipCity && (
          <>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setCityMode("known")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${cityMode === "known" ? "bg-mesh text-white" : "bg-night-800/30 text-foreground-muted hover:bg-night-800/50"}`}
              >
                Pick from list
              </button>
              <button
                onClick={() => setCityMode("custom")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${cityMode === "custom" ? "bg-mesh text-white" : "bg-night-800/30 text-foreground-muted hover:bg-night-800/50"}`}
              >
                Type custom
              </button>
            </div>
            {cityMode === "known" ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search cities..."
                  className="w-full bg-night-800/30 border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
                />
                <select
                  value={cityCode}
                  onChange={(e) => setCityCode(e.target.value)}
                  size={6}
                  className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2 text-foreground font-mono focus:ring-2 focus:ring-mesh focus:border-mesh outline-none text-sm"
                >
                  <option value="">Select city...</option>
                  {filteredCities.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                {citySearch && (
                  <p className="text-xs text-foreground-muted">{filteredCities.length} cities found</p>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 5))}
                placeholder="e.g. DENVR"
                maxLength={5}
                className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono uppercase focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
              />
            )}
          </>
        )}
      </div>

      {/* Step 3: Landmark */}
      <div className="card-mesh p-6">
        <label className="block text-sm font-semibold text-foreground mb-1">
          <span className="text-mountain-500 mr-2">3.</span>Landmark
        </label>
        <p className="text-xs text-foreground-muted mb-3">
          1\u2013{landmarkMaxLen} chars. A-Z, 0-9, and special chars: <span className="font-mono">+ . _ |</span>
        </p>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setLandmarkMode("known")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${landmarkMode === "known" ? "bg-mesh text-white" : "bg-night-800/30 text-foreground-muted hover:bg-night-800/50"}`}
          >
            Pick from list
          </button>
          <button
            onClick={() => setLandmarkMode("custom")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${landmarkMode === "custom" ? "bg-mesh text-white" : "bg-night-800/30 text-foreground-muted hover:bg-night-800/50"}`}
          >
            Type custom
          </button>
        </div>
        {landmarkMode === "known" ? (
          <div className="space-y-2">
            <input
              type="text"
              value={landmarkSearch}
              onChange={(e) => setLandmarkSearch(e.target.value)}
              placeholder="Search landmarks..."
              className="w-full bg-night-800/30 border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
            />
            <select
              value={landmarkCode}
              onChange={(e) => setLandmarkCode(e.target.value)}
              size={6}
              className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2 text-foreground font-mono focus:ring-2 focus:ring-mesh focus:border-mesh outline-none text-sm"
            >
              <option value="">Select landmark...</option>
              {filteredLandmarks.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
            {landmarkSearch && (
              <p className="text-xs text-foreground-muted">{filteredLandmarks.length} landmarks found</p>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={customLandmark}
            onChange={(e) => setCustomLandmark(e.target.value.replace(/[^a-zA-Z0-9.+_|]/g, "").slice(0, landmarkMaxLen))}
            placeholder="e.g. CHSPK"
            maxLength={landmarkMaxLen}
            className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono uppercase focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
          />
        )}
      </div>

      {/* Step 4: Node Type */}
      <div className="card-mesh p-6">
        <label className="block text-sm font-semibold text-foreground mb-1">
          <span className="text-mountain-500 mr-2">4.</span>Node Type
        </label>
        <p className="text-xs text-foreground-muted mb-3">What kind of infrastructure node is this?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {nodeTypes.map((t) => (
            <button
              key={t.code}
              onClick={() => setNodeType(t.code)}
              className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                nodeType === t.code
                  ? "border-mesh bg-mesh/10 text-foreground"
                  : "border-card-border bg-night-800/20 text-foreground-muted hover:border-mesh/50"
              }`}
            >
              <span className="font-mono font-bold text-sm">{t.code}</span>
              <span className="text-sm ml-2">{t.label}</span>
              <p className="text-xs text-foreground-muted mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 5: Public Key */}
      <div className="card-mesh p-6">
        <label className="block text-sm font-semibold text-foreground mb-1">
          <span className="text-mountain-500 mr-2">5.</span>Public Key Prefix
        </label>
        <p className="text-xs text-foreground-muted mb-3">
          First 4 hex characters (0-9, A-F) of your node&apos;s public key.
        </p>
        <input
          type="text"
          value={pubkey}
          onChange={(e) => setPubkey(e.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 4))}
          placeholder="e.g. 9F2E"
          maxLength={4}
          className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono uppercase focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
        />
        <div className="flex flex-wrap gap-3 mt-3">
          <a
            href="https://analyzer.letsmesh.net/nodes/prefix-utilization"
            target="_blank"
            rel="noopener noreferrer"
            className="text-mesh hover:text-mesh-light inline-flex items-center gap-1 text-xs"
          >
            Check Prefix Utilization
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href="https://gessaman.com/mc-keygen/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-mesh hover:text-mesh-light inline-flex items-center gap-1 text-xs"
          >
            Key Generator
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Tips */}
      <div className="card-mesh p-6 bg-mountain-500/5 border-mountain-500/20">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span>&#9881;&#65039;</span> Other Settings
        </h4>
        <div className="space-y-2 text-sm text-foreground-muted">
          <p>
            <strong className="text-foreground">Ownership:</strong> Set the ownership field to <span className="font-mono text-mesh">@yourdiscordname</span> (firmware 1.12.0+). Do not put emojis in repeater names.
          </p>
          <p>
            <strong className="text-foreground">Region Setting:</strong> Set your repeater&apos;s region setting to match its IATA code{region ? <> (<span className="font-mono text-mesh">{region}</span>)</> : ""}.
          </p>
        </div>
      </div>

      {/* Companion Naming */}
      <div className="border-t border-card-border pt-8 mt-8">
        <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-3">
          <span className="text-2xl">📱</span>
          Companion Node Naming
        </h3>
        <p className="text-sm text-foreground-muted mb-6">
          Companions (personal carry nodes) use a different format. This is <strong className="text-foreground">not</strong> generated above — just follow this pattern:
        </p>

        <div className="card-mesh p-5 mb-6">
          <p className="font-mono text-lg text-mesh mb-3 text-center">
            [EMOJI] [HANDLE] [##]
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-foreground-muted">
            <div><span className="font-semibold text-foreground">EMOJI</span> — One per person, claim in Discord</div>
            <div><span className="font-semibold text-foreground">HANDLE</span> — Your mesh alias (not real name)</div>
            <div><span className="font-semibold text-foreground">##</span> — Number by purpose, starting at 01</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            { name: "\u{1F47B} M3SHGH\u00D8ST 01", desc: "Primary carry" },
            { name: "\u{1F47B} M3SHGH\u00D8ST 02", desc: "Home base" },
            { name: "\u{1F43F}\uFE0F SQRLNUT 01", desc: "Primary" },
            { name: "\u{1F525} BURNR F4", desc: "Key prefix suffix" },
          ].map((ex) => (
            <div key={ex.name} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-mesh">{ex.name}</span>
              <span className="text-foreground-muted">— {ex.desc}</span>
            </div>
          ))}
        </div>

        <div className="card-mesh p-4 bg-sunset-500/5 border-sunset-500/20">
          <p className="text-sm font-semibold text-foreground mb-2">Do Not:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-foreground-muted">
            {[
              "Use your real name",
              "Put hardware in the name",
              "Use different emojis per device",
              "Take someone else\u2019s emoji",
              "Go over 23 characters",
            ].map((rule, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sunset-500">✕</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
