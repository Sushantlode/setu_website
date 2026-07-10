import Navbar from "./components/Navbar"
import Hero from "./components/Hero"
import ImpactStats from "./components/ImpactStats"
import Initiatives from "./components/Initiatives"
import ImpactMap from "./components/ImpactMap"
import AboutBanner from "./components/AboutBanner"
import Mission from "./components/Mission"
import Projects from "./components/Projects"
import Devices from "./components/Devices"
import Partner from "./components/Partner"
import Contact from "./components/Contact"
import Footer from "./components/Footer"

export default function App() {
  return (
    <div className="relative min-h-svh">
      <Navbar />
      <main>
        <Hero />
        <ImpactStats />
        <Initiatives />
        <ImpactMap />
        <AboutBanner />
        <Mission />
        <Projects />
        <Devices />
        <Partner />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
