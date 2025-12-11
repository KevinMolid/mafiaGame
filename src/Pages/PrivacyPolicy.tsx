import Main from "../components/Main";

const PrivacyPolicy = () => {
  return (
    <Main>
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-50">
            Personvernerklæring for Den Siste Don
          </h1>
          <p className="text-neutral-400">Sist oppdatert: 11.12.2025</p>
          <p className="text-neutral-200">
            I denne personvernerklæringen forklarer vi hvordan{" "}
            <span className="font-semibold">Molid Digital</span> behandler
            personopplysninger i forbindelse med spillet{" "}
            <span className="font-semibold">Den Siste Don</span> (heretter «Spillet»).
          </p>
        </header>

        {/* 1. Behandlingsansvarlig */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            1. Behandlingsansvarlig
          </h2>
          <p className="text-neutral-200">
            Behandlingsansvarlig for personopplysninger som samles inn og brukes i
            tilknytning til Spillet er:
          </p>
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-4 text-neutral-200 space-y-1">
            <p>
              <span className="font-semibold">Molid Digital</span>
            </p>
            <p>Org.nr.: 936 701 248</p>
            <p>Adresse: Kierschows gate 7D, 0462 Oslo</p>
            <p>E-post: kevinmolid@gmail.com</p>
            <p>Telefon: (+47) 452 63 858</p>
          </div>
          <p className="text-neutral-200">
            I denne erklæringen omtales vi som «vi», «oss» eller «vår».
          </p>
        </section>

        {/* 2. Hvilke opplysninger vi samler inn */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            2. Hvilke personopplysninger vi behandler
          </h2>
          <p className="text-neutral-200">
            Vi kan behandle følgende kategorier av personopplysninger om deg når du
            bruker Spillet:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>
              <span className="font-semibold">Kontoinformasjon:</span> brukernavn,
              spill-ID, språkinnstillinger, spillprogresjon, inventar, statistikk.
            </li>
            <li>
              <span className="font-semibold">Kontaktinformasjon:</span> e-post og
              eventuelt andre opplysninger du oppgir ved kontakt med oss.
            </li>
            <li>
              <span className="font-semibold">Kjøps- og betalingsinformasjon:</span>{" "}
              hvilke digitale varer du kjøper, tidspunkt, beløp og transaksjons-ID.
              Selve betalingsinformasjonen (kortnummer, kontonummer osv.) behandles
              av vår betalingsleverandør (f.eks. Vipps) og ikke av oss.
            </li>
            <li>
              <span className="font-semibold">Teknisk informasjon:</span> IP-adresse,
              enhetstype, operativsystem, nettleser og lignende tekniske data som
              kan bli behandlet for å drifte og sikre Spillet.
            </li>
            <li>
              <span className="font-semibold">Kommunikasjon:</span> henvendelser du
              sender til oss (for eksempel via e-post eller supportsystem), samt
              våre svar.
            </li>
          </ul>
        </section>

        {/* 3. Formål med behandlingen */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            3. Formål med behandlingen
          </h2>
          <p className="text-neutral-200">
            Vi behandler personopplysninger om deg til følgende formål:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>
              <span className="font-semibold">Drift av Spillet:</span> opprette og
              administrere brukerkonto, lagre spilldata og progresjon, og sørge for
              at Spillet fungerer teknisk.
            </li>
            <li>
              <span className="font-semibold">Gjennomføring av kjøp:</span> håndtere
              kjøp av digitale varer, levere innholdet til kontoen din og føre
              nødvendig kjøpshistorikk.
            </li>
            <li>
              <span className="font-semibold">Kundeservice:</span> besvare
              henvendelser, feilsøke problemer og yte support.
            </li>
            <li>
              <span className="font-semibold">Sikkerhet og misbruksforebygging:</span>{" "}
              forebygge svindel, misbruk og uautorisert tilgang, og håndtere
              brudd på spillregler.
            </li>
            <li>
              <span className="font-semibold">Forbedring av Spillet:</span> analysere
              bruksmønstre på et overordnet nivå for å forbedre funksjonalitet,
              balanse og brukeropplevelse.
            </li>
            <li>
              <span className="font-semibold">Lovpålagte krav:</span> oppfylle
              regnskapsplikter og andre rettslige forpliktelser.
            </li>
          </ul>
        </section>

        {/* 4. Behandlingsgrunnlag */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            4. Behandlingsgrunnlag
          </h2>
          <p className="text-neutral-200">
            Vi behandler personopplysninger basert på følgende rettslige
            grunnlag etter personvernforordningen (GDPR):
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>
              <span className="font-semibold">Avtale (GDPR art. 6 (1) b):</span>{" "}
              når behandlingen er nødvendig for å oppfylle avtalen med deg om
              bruk av Spillet og/eller gjennomføring av kjøp.
            </li>
            <li>
              <span className="font-semibold">
                Berettiget interesse (GDPR art. 6 (1) f):
              </span>{" "}
              for eksempel ved sikkerhetstiltak, misbruksforebygging og
              videreutvikling av Spillet, hvor vår interesse vurderes opp mot dine
              personverninteresser.
            </li>
            <li>
              <span className="font-semibold">Rettslig forpliktelse (GDPR art. 6 (1) c):</span>{" "}
              når vi er pålagt å lagre enkelte opplysninger i henhold til
              regnskapsregler eller annen lovgivning.
            </li>
            <li>
              <span className="font-semibold">Samtykke (GDPR art. 6 (1) a):</span>{" "}
              for eventuell markedsføring eller andre formål der lovverket
              krever samtykke. Du kan når som helst trekke tilbake et slikt samtykke.
            </li>
          </ul>
        </section>

        {/* 5. Lagringstid */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            5. Lagringstid
          </h2>
          <p className="text-neutral-200">
            Vi lagrer personopplysninger så lenge det er nødvendig for å oppfylle
            formålene beskrevet over, eller så lenge vi er pålagt å gjøre det etter
            gjeldende lov.
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>
              Kontoinformasjon og spilldata lagres så lenge du har en aktiv konto,
              og kan slettes eller anonymiseres dersom du ber om sletting og det
              ikke finnes rettslig grunnlag for videre lagring.
            </li>
            <li>
              Kjøps- og transaksjonsdata lagres i tråd med regnskapsreglene i{" "}
              <span className="whitespace-nowrap">1 år</span>.
            </li>
            <li>
              Kommunikasjon og supportsaker lagres så lenge det er nødvendig for å
              følge opp saken og for dokumentasjon.
            </li>
          </ul>
        </section>

        {/* 6. Deling av personopplysninger */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            6. Deling av personopplysninger
          </h2>
          <p className="text-neutral-200">
            Vi deler ikke personopplysninger med tredjeparter utover det som er
            nødvendig for å drifte Spillet og tilby tjenestene, med mindre vi er
            rettslig forpliktet til det. Vi kan dele opplysninger med:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>
              <span className="font-semibold">Tekniske leverandører:</span> som
              leverer servere, drift, datalagring eller andre IT-tjenester.
            </li>
            <li>
              <span className="font-semibold">Betalingsleverandører:</span> som Vipps
              MobilePay, for å håndtere betalinger og sikre gjennomføring av kjøp.
            </li>
            <li>
              <span className="font-semibold">Offentlige myndigheter:</span> dersom vi
              er pålagt å utlevere opplysninger ved lov, rettskjennelser eller
              lignende.
            </li>
          </ul>
          <p className="text-neutral-200">
            Der vi bruker databehandlere, har vi inngått databehandleravtaler som
            regulerer hvordan leverandøren kan behandle personopplysninger på våre
            vegne.
          </p>
        </section>

        {/* 7. Vipps og andre betalingsleverandører */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            7. Vipps og andre betalingsleverandører
          </h2>
          <p className="text-neutral-200">
            Når du velger Vipps eller andre betalingsmetoder i Spillet, vil den
            aktuelle betalingsleverandøren være egen behandlingsansvarlig for sin
            behandling av personopplysninger. Vi mottar normalt ikke dine fulle
            betalingsdetaljer (som kortnummer og kontonummer).
          </p>
          <p className="text-neutral-200">
            Vipps MobilePay behandler personopplysninger i tråd med sine egne
            vilkår og personvernerklæringer. Vi anbefaler at du gjør deg kjent med
            disse på Vipps MobilePay sine nettsider.
          </p>
        </section>

        {/* 8. Informasjonskapsler (cookies) */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            8. Informasjonskapsler (cookies) og lignende teknologi
          </h2>
          <p className="text-neutral-200">
            Spillet og tilhørende nettsider kan bruke informasjonskapsler
            («cookies») og lignende teknologi for å:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Husk innstillinger og påloggingsstatus</li>
            <li>Forbedre brukeropplevelsen</li>
            <li>Føre anonym statistikk og bruksmønstre</li>
          </ul>
          <p className="text-neutral-200">
            Du kan vanligvis administrere bruken av informasjonskapsler gjennom
            innstillingene i nettleseren eller enheten din. Vær oppmerksom på at
            enkelte funksjoner i Spillet kan fungere dårligere dersom du blokkerer
            visse typer informasjonskapsler.
          </p>
        </section>

        {/* 9. Sikkerhet */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            9. Informasjonssikkerhet
          </h2>
          <p className="text-neutral-200">
            Vi tar informasjonssikkerhet på alvor og har iverksatt tekniske og
            organisatoriske tiltak for å beskytte personopplysninger mot
            uautorisert tilgang, endring, tap eller ødeleggelse.
          </p>
          <p className="text-neutral-200">
            Ingen systemer kan likevel garanteres å være 100 % sikre. Det er derfor
            også viktig at du selv:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>Bruker sterke passord</li>
            <li>Ikke deler innloggingsinformasjon med andre</li>
            <li>Sørger for å oppdatere enhet og programvare jevnlig</li>
          </ul>
        </section>

        {/* 10. Dine rettigheter */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            10. Dine rettigheter
          </h2>
          <p className="text-neutral-200">
            Som registrert har du flere rettigheter etter personvernregelverket.
            Blant annet kan du:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>
              Be om innsyn i hvilke personopplysninger vi har om deg, og få en
              kopi.
            </li>
            <li>Be om retting av uriktige eller ufullstendige opplysninger.</li>
            <li>
              Be om sletting av opplysninger («retten til å bli glemt»), der dette
              ikke er i konflikt med andre rettslige forpliktelser (f.eks.
              regnskapsregler).
            </li>
            <li>
              Be om begrensning av behandling i visse situasjoner, eller protestere
              mot behandling basert på berettiget interesse.
            </li>
            <li>
              Trekke tilbake samtykke der behandlingen er basert på samtykke (for
              eksempel for markedsføring).
            </li>
            <li>
              Klage til Datatilsynet dersom du mener at vår behandling er i strid
              med personvernregelverket.
            </li>
          </ul>
          <p className="text-neutral-200">
            For å utøve dine rettigheter kan du kontakte oss på{" "}
            <span className="font-semibold">kevinmolid@gmail.com</span>. Vi vil svare deg
            så snart som mulig og senest innen de fristene som følger av lovverket.
          </p>
        </section>

        {/* 11. Overføring utenfor EU/EØS */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            11. Overføring av opplysninger utenfor EU/EØS
          </h2>
          <p className="text-neutral-200">
            Dersom vi benytter leverandører eller tjenester som medfører
            overføring av personopplysninger til land utenfor EU/EØS, vil slik
            overføring kun skje dersom det foreligger et gyldig
            overføringsgrunnlag, for eksempel:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-200">
            <li>EU-kommisjonens standard personvernbestemmelser (SCC)</li>
            <li>
              Overføringsbeslutning («adequacy decision») fra EU-kommisjonen for
              det aktuelle landet
            </li>
          </ul>
          <p className="text-neutral-200">
            Du kan kontakte oss dersom du ønsker mer informasjon om eventuelle
            overføringer og relevante garantier.
          </p>
        </section>

        {/* 12. Endringer i personvernerklæringen */}
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">
            12. Endringer i personvernerklæringen
          </h2>
          <p className="text-neutral-200">
            Vi kan oppdatere denne personvernerklæringen ved behov, for eksempel på
            grunn av endringer i Spillet, nye funksjoner eller endringer i
            regelverket.
          </p>
          <p className="text-neutral-200">
            Den nyeste versjonen vil alltid være tilgjengelig i Spillet og/eller
            på vår nettside. Ved vesentlige endringer vil vi informere deg på en
            tydelig måte (for eksempel ved innlogging eller i Spillet).
          </p>
        </section>

        {/* 13. Kontaktinformasjon */}
        <section className="space-y-2 border-t border-neutral-800 pt-6 mt-6">
          <h2 className="text-xl font-semibold text-neutral-50">
            13. Kontaktinformasjon
          </h2>
          <p className="text-neutral-200">
            Hvis du har spørsmål om denne personvernerklæringen eller hvordan vi
            behandler personopplysninger, kan du kontakte oss på:
          </p>
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-4 text-neutral-200 space-y-1">
            <p>
              <span className="font-semibold">Molid Digital</span>
            </p>
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

export default PrivacyPolicy;
