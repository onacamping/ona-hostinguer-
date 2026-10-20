import { ReactNode } from "react";

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h3 className="text-lg font-serif font-bold text-primary">{title}</h3>
    {children}
  </section>
);

const Sub = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <h4 className="font-bold text-primary text-sm mb-1">{title}</h4>
    <p className="text-sm text-stone-600 leading-relaxed">{children}</p>
  </div>
);

const List = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc pl-5 space-y-2 text-sm text-stone-600 leading-relaxed">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

const P = ({ children }: { children: ReactNode }) => (
  <p className="text-sm text-stone-600 leading-relaxed">{children}</p>
);

export default function PoliciesContent() {
  return (
    <div className="space-y-8">
      <Section title="1. Reservas y pagos">
        <Sub title="Reserva anticipada">
          Recomendamos reservar con anticipación para garantizar disponibilidad. Antes de pagar, revisa con cuidado la fecha, el plan, el Loving y los adicionales que elegiste.
        </Sub>
        <Sub title="Confirmación de la reserva">
          La reserva queda confirmada con el pago de un anticipo del 35% del valor total. El saldo restante se paga al llegar a Oná, antes de iniciar la experiencia.
        </Sub>
        <Sub title="Medios de pago">
          Puedes pagar por código QR o por llave. Si prefieres pagar con tarjeta, el pago se hace directamente con nuestro equipo y tiene un recargo del 5%.
        </Sub>
      </Section>

      <Section title="2. Cancelaciones y cambios de fecha">
        <List
          items={[
            <><b>Cancelación con 15 días o más de anticipación:</b> se reembolsa el 100% del anticipo.</>,
            <><b>Cancelación con menos de 15 días:</b> no hay reembolso del anticipo.</>,
            <><b>Cambio de fecha:</b> puedes reprogramar una sola vez, sin costo, si lo solicitas con mínimo 5 días de anticipación a la llegada, sujeto a disponibilidad. La nueva fecha debe usarse dentro de los 30 días siguientes a la fecha original. Si la nueva fecha tiene otro precio (por ejemplo, en temporada), se paga la diferencia.</>,
            <><b>Si no llegas y no avisas:</b> la reserva se da por utilizada y no hay reembolso ni cambio de fecha.</>,
            <><b>Situaciones ajenas a la pareja y a Oná</b>, como paros, derrumbes, cierres de vías o accidentes: se permite cambiar la fecha sin costo, sujeto a disponibilidad.</>,
            "No hay reembolsos por condiciones del clima, lluvias, cortes de luz u otras situaciones externas fuera de nuestro control.",
            "Oná no se hace responsable por errores de la pareja al reservar (fecha, plan, Loving o adicionales). No se hacen reembolsos por malentendidos sobre lo que incluye un plan cuando está claramente descrito en la página.",
          ]}
        />
      </Section>

      <Section title="3. Llegada y salida">
        <Sub title="Llegada (check-in)">
          Desde las 3:00 p. m. La última hora de llegada es a las 6:00 p. m.; después de esa hora no se hacen ingresos ni se prestan servicios.
        </Sub>
        <Sub title="Salida (check-out)">
          Antes de las 12:00 a. m. La salida tardía está sujeta a disponibilidad: cada hora adicional cuesta $40.000 y debe pedirse con anticipación. Te pedimos dejar el Loving limpio y en buen estado.
        </Sub>
      </Section>

      <Section title="4. Horarios de la experiencia">
        <List
          items={[
            "Fogata: 6:00 p. m.",
            "Cena: entre 7:30 y 8:00 p. m.",
            "Desayuno Sabor de Mamá: entre 8:30 y 10:00 a. m.",
            "Almuerzo: bajo pedido y con anticipación, como adicional.",
          ]}
        />
      </Section>

      <Section title="5. Normas de convivencia">
        <Sub title="Experiencia para parejas">
          Oná es una experiencia exclusiva para parejas mayores de 18 años.
        </Sub>
        <Sub title="Tranquilidad">
          Pedimos mantener el volumen bajo en todas las áreas, por el descanso de todas las parejas. <b>No se permiten gritos, discusiones, comportamientos obscenos ni actitudes que incomoden a otros huéspedes o al equipo.</b> El incumplimiento de esta norma puede ser motivo de retiro inmediato sin reembolso.
        </Sub>
        <Sub title="Mascotas">
          Tu mascota es bienvenida; recomendamos que sea pequeña, siempre que esté bajo tu supervisión, recojas sus desechos y no moleste a otros huéspedes ni dañe las instalaciones.
        </Sub>
        <Sub title="Bebidas y snacks">
          Puedes traer tus propias bebidas, incluidas las alcohólicas, y tus snacks, sin ningún cargo. La cena y el desayuno ya vienen incluidos en tu plan.
        </Sub>
        <div>
          <h4 className="font-bold text-primary text-sm mb-1">Cuidado de los espacios</h4>
          <List
            items={[
              "Al confirmar la reserva, la pareja se compromete a cuidar las instalaciones y dejar todo en el mismo estado en que lo recibió. Los daños o pérdidas de elementos de Oná los asume la pareja.",
              "Las fogatas solo se hacen en las zonas designadas.",
              "No se permite comer ni beber dentro de la piscina o jacuzzi.",
              "No se permite arrojar basura, vidrio, cigarrillos u otros objetos en la fogata, la piscina o el jacuzzi.",
              "Solo se puede fumar en las áreas designadas, nunca dentro de los Lovings.",
            ]}
          />
        </div>
      </Section>

      <Section title="6. Seguridad y responsabilidad">
        <List
          items={[
            "Contamos con cámaras de seguridad solo en áreas comunes, para la tranquilidad de las parejas. Nunca hay cámaras dentro de los Lovings, los baños ni los jacuzzis privados. Las grabaciones de seguridad son confidenciales y solo se usan con ese fin.",
            "Oná no se hace responsable por objetos personales perdidos o dañados. Los objetos olvidados se guardan durante 30 días; si nadie los reclama, se donan o se desechan.",
            "En caso de emergencia, el equipo está disponible las 24 horas.",
            "Está prohibido ingresar armas de fuego, elementos cortopunzantes, explosivos o sustancias alucinógenas.",
            "No se toleran faltas de respeto ni agresiones físicas o verbales. Cualquier comportamiento violento será motivo de retiro inmediato sin reembolso y se informará a las autoridades.",
          ]}
        />
      </Section>

      <Section title="7. Derecho de admisión">
        <P>
          Oná se reserva el derecho de admisión y permanencia de personas que alteren la seguridad o la tranquilidad del lugar.
        </P>
      </Section>

      <Section title="8. Promociones y novedades">
        <P>
          Al reservar, nos autorizas a escribirte por WhatsApp, correo o redes sociales con promociones, planes de temporada, novedades, obsequios y beneficios de Oná. Puedes dejar de recibirlos cuando quieras: basta con respondernos “no quiero recibir más mensajes” o escribir a onaxperience0@gmail.com.
        </P>
      </Section>

      <Section title="9. Fotos y videos">
        <P>
          Nos encanta guardar los recuerdos de cada experiencia. En algunos momentos puntuales, como la fogata, la entrega de la cena, el montaje del cine o la decoración, nuestro equipo puede tomar fotos o videos cortos para compartir la magia de Oná.
        </P>
        <List
          items={[
            "Al reservar, autorizas a Oná a usar esas fotos y videos en sus redes sociales, página web, material impreso y publicidad, en Colombia y en el exterior, sin que esto genere un pago o compensación.",
            "Si prefieres no aparecer, cuéntanos cuando confirmemos tu reserva por WhatsApp o dile a nuestro equipo cuando llegues, y lo respetaremos.",
            "Si ya aparece una foto o un video tuyo y quieres que lo quitemos, escríbenos a onaxperience0@gmail.com y lo retiramos de nuestras cuentas en máximo 5 días hábiles.",
            "Para contenidos donde la pareja es protagonista, como un testimonio o una entrevista, siempre pedimos una autorización aparte.",
          ]}
        />
      </Section>

      <Section title="10. Tratamiento de datos personales">
        <P>En Oná cuidamos tu información y la tratamos según la Ley 1581 de 2012 y sus decretos reglamentarios.</P>
        <Sub title="Quién es responsable">
          Oná Xperience, San Antonio del Tequendama, Cundinamarca. Correo: onaxperience0@gmail.com. WhatsApp: +57 319 249 7753.
        </Sub>
        <Sub title="Qué datos recogemos">
          Nombre, documento de identidad, teléfono, correo y los datos de tu reserva (fechas, plan, Loving, adicionales y pagos). Oná no guarda los datos de tu tarjeta.
        </Sub>
        <div>
          <h4 className="font-bold text-primary text-sm mb-1">Para qué los usamos</h4>
          <List
            items={[
              "Gestionar tu reserva y comunicarnos contigo antes, durante y después de tu experiencia.",
              "Cumplir obligaciones legales, como el registro de huéspedes y la facturación.",
              "Enviarte encuestas para mejorar nuestro servicio.",
              "Enviarte promociones, novedades, obsequios y beneficios, y mostrarte anuncios de Oná en redes sociales (ver punto 9).",
            ]}
          />
        </div>
        <Sub title="Tus derechos">
          Puedes conocer, actualizar y corregir tus datos, pedir prueba de la autorización que nos diste, saber cómo los usamos, revocar la autorización o pedir que los eliminemos, y presentar quejas ante la Superintendencia de Industria y Comercio. Para hacerlo, escríbenos a onaxperience0@gmail.com. Respondemos las consultas en máximo 10 días hábiles y los reclamos en máximo 15 días hábiles.
        </Sub>
        <Sub title="Cookies y anuncios">
          Nuestra página usa cookies y el píxel de Meta para medir las visitas y mostrar anuncios de Oná a personas que ya nos conocen.
        </Sub>
      </Section>

      <Section title="11. Quejas y sugerencias">
        <P>
          Durante tu estadía puedes contarle cualquier inconveniente o sugerencia directamente a nuestro equipo. Después, puedes escribirnos por WhatsApp al +57 319 249 7753 o a onaxperience0@gmail.com, de lunes a domingo, de 8:00 a. m. a 5:00 p. m.
        </P>
      </Section>

      <p className="text-sm text-primary font-bold leading-relaxed">
        Al confirmar tu reserva, aceptas haber leído y estar de acuerdo con los requisitos y políticas de Oná.
      </p>
      <p className="text-sm text-stone-500 italic">
        Gracias por ayudarnos a cuidar este espacio. Que tu experiencia en Oná sea mágica.
      </p>
    </div>
  );
}
