import Main from "../components/Main";

const SalesTermsAndConditions = () => {
  return (
    <Main>
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-50">
            Salgsvilkår for Den Siste Don
          </h1>
          <p className="text-neutral-400">
            Sist oppdatert: 11.12.2025
          </p>
          <p className="text-neutral-200">
            Disse salgsvilkårene gjelder for kjøp av digitale varer og tjenester i
            spillet <span className="font-semibold">Den Siste Don</span> (heretter
            «Spillet»). Ved å opprette bruker og/eller gjennomføre kjøp i Spillet,
            aksepterer du disse vilkårene.
          </p>
        </header>

        {/* 1. Parter */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">1. Parter</h2>
          <p className="text-neutral-200">
            Selger er:
          </p>
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-4 text-neutral-200 space-y-1">
            <p><span className="font-semibold">Molid Digital</span></p>
            <p>Org.nr.: 936 701 248</p>
            <p>Adresse: Kierschows gate 7D, 0462 Oslo</p>
            <p>E-post: kevinmolid@gmail.com</p>
            <p>Telefon: (+47) 452 63 858</p>
          </div>
          <p className="text-neutral-200">
            («Selger», «vi», «oss» eller «vår»)
          </p>
          <p className="text-neutral-200">
            Kjøper er den personen som oppretter brukerkonto og/eller gjennomfører
            kjøp i Spillet («Kunden», «du»).
          </p>
        </section>

        {/* 2. Produkter og tjenester */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            2. Produkter og tjenester
          </h2>
          <p className="text-neutral-200">
            I Spillet kan du kjøpe blant annet (ikke uttømmende liste):
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Virtuell valuta (f.eks. diamanter)</li>
            <li>Virtuelle gjenstander (f.eks. våpen, biler, utstyr, kosmetiske effekter)</li>
            <li>Eventuelle premium-fordeler eller andre digitale tilleggstjenester</li>
          </ul>
          <p className="text-neutral-200">
            Alle produkter er utelukkende digitale og gir kun rettigheter/fordeler
            inne i Spillet. De har ingen verdi utenfor Spillet, kan ikke innløses i
            ekte penger og kan som hovedregel ikke overføres til andre brukere.
          </p>
          <p className="text-neutral-200">
            Vi forbeholder oss retten til å endre, fjerne eller balansere digitale
            varer, funksjoner og spillmekanikker når som helst, for eksempel av
            hensyn til spillbalanse eller tekniske forhold.
          </p>
        </section>

        {/* 3. Brukerkonto og aldersgrense */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            3. Brukerkonto og aldersgrense
          </h2>
          <p className="text-neutral-200">
            For å bruke Spillet og gjennomføre kjøp må du:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Ha en gyldig brukerkonto i Spillet</li>
            <li>Oppgi korrekte og oppdaterte opplysninger</li>
            <li>Ha lovlig adgang til å bruke valgt betalingsmåte (f.eks. Vipps-kontoen din)</li>
          </ul>
          <p className="text-neutral-200">
            Dersom du er under 18 år, forutsetter bruk av Spillet og kjøp at du har
            samtykke fra foresatte. Du er selv ansvarlig for å innhente slikt
            samtykke.
          </p>
        </section>

        {/* 4. Priser og betaling */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-neutral-50">
            4. Priser og betaling
          </h2>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-neutral-50">
              4.1 Priser
            </h3>
            <ul className="list-disc list-inside space-y-1 text-neutral-200">
              <li>Alle priser vises i norske kroner (NOK).</li>
              <li>Gjeldende priser fremgår tydelig i butikken i Spillet før du bekrefter kjøpet.</li>
              <li>
                Vi kan endre prisene når som helst, men endringer får bare virkning
                for kjøp du gjør etter at prisen er oppdatert.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-neutral-50">
              4.2 Betalingsmåte (Vipps m.m.)
            </h3>
            <p className="text-neutral-200">
              Betaling kan skje med Vipps og eventuelt andre tilgjengelige
              betalingsløsninger som vises i Spillet til enhver tid.
            </p>
            <p className="text-neutral-200">
              Når du bekrefter et kjøp:
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-200">
              <li>Trekkes beløpet umiddelbart fra valgt betalingskilde.</li>
              <li>
                Godkjenner du samtidig at vi leverer det digitale innholdet
                umiddelbart etter betaling.
              </li>
            </ul>
          </div>
        </section>

        {/* 5. Levering */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">5. Levering</h2>
          <p className="text-neutral-200">
            Digitale varer leveres umiddelbart til brukerkontoen din i Spillet
            etter at betalingen er godkjent.
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Normalt vil varen/valutaen være tilgjengelig i løpet av få sekunder/minutter.</li>
            <li>
              Hvis du ikke mottar varen, skal du kontakte oss så raskt som mulig
              på kevinmolid@gmail.com og oppgi brukernavn, tidspunkt for kjøpet og
              kvittering/transaction ID hvis mulig.
            </li>
          </ul>
          <p className="text-neutral-200">
            Vi er ikke ansvarlige for forsinket levering som skyldes tekniske
            problemer hos tredjepart (for eksempel nettleverandør,
            betalingsleverandør eller plattformleverandør), men vi vil alltid
            forsøke å hjelpe deg med å løse problemet.
          </p>
        </section>

        {/* 6. Angrerett */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            6. Angrerett for digitale varer
          </h2>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-neutral-50">
              6.1 Generelt om angrerett
            </h3>
            <p className="text-neutral-200">
              Etter angrerettloven har forbrukere normalt 14 dagers angrerett ved
              kjøp på nett. For digitalt innhold som leveres umiddelbart, gjelder
              imidlertid et unntak.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-neutral-50">
              6.2 Bortfall av angrerett
            </h3>
            <p className="text-neutral-200">
              Ved kjøp av digitale varer i Spillet (som diamanter og virtuelle
              gjenstander):
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-200">
              <li>Leveres varen umiddelbart til brukerkontoen din etter betaling.</li>
              <li>
                Du samtykker ved kjøpet til at levering starter umiddelbart, og at
                angreretten bortfaller.
              </li>
            </ul>
            <p className="text-neutral-200">
              Dette følger av angrerettloven § 22 bokstav n.
            </p>
            <p className="text-neutral-200">
              Det betyr at du normalt ikke har angrerett på kjøp av digitale varer i
              Spillet.
            </p>
          </div>
        </section>

        {/* 7. Retur og refusjon */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            7. Retur og refusjon
          </h2>
          <p className="text-neutral-200">
            Siden vi selger digitalt innhold som leveres umiddelbart og ikke kan
            «leveres tilbake», tilbyr vi som hovedregel ikke retur eller refusjon
            etter gjennomført og levert kjøp.
          </p>
          <p className="text-neutral-200">
            Unntak kan gjøres dersom:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Det har oppstått en teknisk feil som gjør at du ikke mottar varen du har betalt for, eller</li>
            <li>Du ved en åpenbar feil hos oss har blitt trukket for et feil beløp.</li>
          </ul>
          <p className="text-neutral-200">
            I slike tilfeller vurderer vi hver sak konkret. Ta kontakt med oss på
            kevinmolid@gmail.com innen rimelig tid, og senest innen 30 dager
            etter kjøpet.
          </p>
        </section>

        {/* 8. Reklamasjon og feil */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            8. Reklamasjon og feil
          </h2>
          <p className="text-neutral-200">
            Dersom du mener at det er feil ved:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Et kjøp (for eksempel galt beløp eller uteblitt vare), eller</li>
            <li>En levert digital vare (for eksempel gjenstand som ikke fungerer i Spillet som beskrevet),</li>
          </ul>
          <p className="text-neutral-200">
            kan du reklamere til oss ved å sende en henvendelse til kevinmolid@gmail.com
            og oppgi:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Brukernavn</li>
            <li>Hva du har kjøpt</li>
            <li>Tidspunkt for kjøpet</li>
            <li>Hva som er problemet</li>
          </ul>
          <p className="text-neutral-200">
            Vi vil undersøke saken og gi deg en tilbakemelding så snart som mulig.
            Dersom feilen skyldes oss eller våre leverandører, vil vi normalt:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Levere ny/korrekt digital vare, eller</li>
            <li>Kreditere brukerkontoen din i Spillet, eller</li>
            <li>I særskilte tilfeller vurdere refusjon.</li>
          </ul>
        </section>

        {/* 9. Misbruk og stenging */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            9. Misbruk og stenging av konto
          </h2>
          <p className="text-neutral-200">
            Vi forbeholder oss retten til å:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Sperre eller stenge brukerkontoen din</li>
            <li>Fjerne eller tilbakeføre digital valuta og/eller gjenstander</li>
          </ul>
          <p className="text-neutral-200">
            dersom vi har rimelig grunn til å tro at kontoen eller kjøpene:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Er knyttet til svindel, misbruk av betalingsmidler eller brudd på lovverket</li>
            <li>Bryter med spillreglene eller brukervilkårene for Spillet</li>
            <li>Innebærer hacking, utnyttelse av feil eller annen urettmessig fordel</li>
          </ul>
          <p className="text-neutral-200">
            Ved slik stenging kan du miste tilgang til kjøpte digitale varer uten
            rett til refusjon, med mindre annet følger direkte av ufravikelig
            lovgivning.
          </p>
        </section>

        {/* 10. Endring av vilkår */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            10. Endring av vilkår og tjenester
          </h2>
          <p className="text-neutral-200">
            Vi kan oppdatere disse salgsvilkårene ved behov, for eksempel ved:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Endring i lovverk</li>
            <li>Nye funksjoner eller produkter i Spillet</li>
            <li>Endringer i betalingsløsninger eller tekniske løsninger</li>
          </ul>
          <p className="text-neutral-200">
            Oppdaterte vilkår publiseres i Spillet og/eller på vår nettside. Ved
            vesentlige endringer vil du bli informert på en tydelig måte (for
            eksempel ved innlogging eller i kjøpsflyten). Fortsatt bruk av Spillet
            og nye kjøp etter endringer anses som aksept av oppdaterte vilkår.
          </p>
          <p className="text-neutral-200">
            Vi kan også endre eller fjerne funksjoner, digitale varer og
            spillmekanikker uten forhåndsvarsel dersom det er nødvendig av tekniske,
            sikkerhetsmessige eller spillbalansemessige grunner.
          </p>
        </section>

        {/* 11. Ansvarsbegrensning */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            11. Ansvarsbegrensning
          </h2>
          <p className="text-neutral-200">
            Så langt loven tillater det, er vårt ansvar begrenset til:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Direkte tap som skyldes forhold på vår side, og</li>
            <li>Maksimalt opp til det beløpet du har betalt oss de siste 12 månedene før kravet oppsto.</li>
          </ul>
          <p className="text-neutral-200">
            Vi er ikke ansvarlige for:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Indirekte tap (for eksempel tapt fortjeneste, tap av data, tap av spillprogresjon)</li>
            <li>Tap som skyldes teknisk svikt hos tredjepart</li>
            <li>
              Feil eller misbruk som skyldes din egen håndtering av konto, enhet
              eller påloggingsdetaljer
            </li>
          </ul>
          <p className="text-neutral-200">
            Dette påvirker ikke dine ufravikelige rettigheter som forbruker etter
            gjeldende lov.
          </p>
        </section>

        {/* 12. Personvern */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">12. Personvern</h2>
          <p className="text-neutral-200">
            Vi behandler personopplysninger om deg i forbindelse med:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Opprettelse og administrasjon av brukerkonto</li>
            <li>Gjennomføring av kjøp og betalinger</li>
            <li>Drift og videreutvikling av Spillet</li>
          </ul>
          <p className="text-neutral-200">
            Mer informasjon finner du i vår Personvernerklæring, som er
            tilgjengelig på [lenke til personvernside].
          </p>
          <p className="text-neutral-200">
            Ved bruk av Vipps som betalingsmetode vil Vipps MobilePay være egen
            behandlingsansvarlig for sin behandling av personopplysninger. Se Vipps'
            egne vilkår og personvernerklæring for mer informasjon.
          </p>
        </section>

        {/* 13. Konfliktløsning */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            13. Konfliktløsning og lovvalg
          </h2>
          <p className="text-neutral-200">
            Vi ønsker å løse eventuelle uenigheter i minnelighet. Ta gjerne kontakt
            med oss på kevinmolid@gmail.com først dersom du er misfornøyd med en vare, et
            kjøp eller vår håndtering av en sak.
          </p>
          <p className="text-neutral-200">
            Dersom vi ikke kommer til enighet, kan du som forbruker:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Ta kontakt med Forbrukerrådet for mekling.</li>
          </ul>
          <p className="text-neutral-200">
            Disse salgsvilkårene reguleres av norsk rett. Eventuelle tvister som
            ikke løses i minnelighet, kan bringes inn for de ordinære domstolene.
          </p>
        </section>

        {/* 14. Kontaktinformasjon */}
        <section className="space-y-2 border-t border-neutral-800 pt-6 mt-6">
          <h2 className="text-xl font-semibold text-neutral-50">
            14. Kontaktinformasjon
          </h2>
          <p className="text-neutral-200">
            Har du spørsmål om disse vilkårene eller et konkret kjøp?
          </p>
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-4 text-neutral-200 space-y-1">
            <p><span className="font-semibold">Molid Digital</span></p>
            <p>Org.nr.: 936 701 248</p>
            <p>Adresse: Kierschows gate 7D, 0462 Oslo</p>
            <p>E-post: kevinmolid@gmail.com</p>
            <p>Telefon: (+47) 452 63 858</p>
          </div>
        </section>
      </section>
    </Main>
  );
};

export default SalesTermsAndConditions;
