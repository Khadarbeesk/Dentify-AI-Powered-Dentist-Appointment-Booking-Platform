
import { useEffect, useState, useRef } from "react";
import DentistCard from "../components/DentistCard";
import BookingModal from "../components/BookingModal";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import HealthCarousel from "../components/HealthCarousel";
import ExperienceSection from "../components/ExperienceSection";
import WhyChooseUs from "../components/WhyChooseUs";
import API from "../config";

export default function Home() {
  const [dentists, setDentists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Reference to doctors section
  const doctorsSectionRef = useRef(null);
  const shouldScroll = useRef(false);

  // Doctors per page
  const perPage = 6;

  // FETCH DOCTORS
  useEffect(() => {
    const fetchDentists = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API}/api/dentists`);

        if (!response.ok) {
          throw new Error("Failed to fetch doctors");
        }

        const data = await response.json();

        setDentists(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error("Error fetching dentists:", err);
        setDentists([]);

      } finally {
        setLoading(false);
      }
    };

    fetchDentists();
  }, []);

  // SEARCH FILTER
  const filtered = dentists.filter((d) =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  // TOTAL PAGES
  const totalPages = Math.ceil(filtered.length / perPage);

  // CURRENT PAGE
  const currentPage = Math.min(
    page,
    Math.max(totalPages, 1)
  );

  // PAGINATION
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  const paginated = filtered.slice(startIndex, endIndex);

  // SCROLL AFTER PAGE CHANGES
  useEffect(() => {
    if (shouldScroll.current) {
      shouldScroll.current = false;

      doctorsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [page]);

  // NEXT PAGE
  const nextPage = () => {
    if (currentPage < totalPages) {
      shouldScroll.current = true;
      setPage((prev) => prev + 1);
    }
  };

  // PREVIOUS PAGE
  const prevPage = () => {
    if (currentPage > 1) {
      shouldScroll.current = true;
      setPage((prev) => prev - 1);
    }
  };

  // SEARCH
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">

      {/* HERO */}
      <Hero />

      {/* TITLE + SEARCH */}
      <div
        ref={doctorsSectionRef}
        className="px-6 md:px-20 mt-16 text-center scroll-mt-24"
      >

        <h2
          id="doctors"
          className="text-3xl md:text-4xl font-bold text-gray-800"
        >
          Top Doctors to Book
        </h2>

        <p className="text-gray-500 mt-3">
          Browse through our trusted dentists and book instantly.
        </p>

        {/* SEARCH BAR */}
        <input
          type="text"
          placeholder="Search doctors..."
          value={search}
          onChange={handleSearch}
          className="mt-6 p-3 w-full md:w-1/3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />

      </div>

      {/* LOADING SPINNER */}
      {loading && (
        <div className="flex justify-center mt-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filtered.length === 0 && (
        <div className="text-center mt-10 text-gray-400 text-lg">
          No doctors found.
        </div>
      )}

      {/* DOCTOR CARDS */}
      {!loading && filtered.length > 0 && (
        <>

          <div
            id="doctor-list"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-20 py-10"
          >

            {paginated.map((d) => (
              <DentistCard
                key={d._id}
                dentist={d}
                onBook={setSelected}
              />
            ))}

          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (

            <div className="flex justify-center items-center gap-4 mb-10">

              {/* PREVIOUS */}
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={prevPage}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-300 transition-all duration-300"
              >
                ← Prev
              </button>

              {/* PAGE NUMBER */}
              <span className="text-gray-700 font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              {/* NEXT */}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={nextPage}
                className="px-5 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition-all duration-300"
              >
                Next →
              </button>

            </div>

          )}

        </>
      )}

      {/* BOOKING MODAL */}
      {selected && (
        <BookingModal
          dentist={selected}
          close={() => setSelected(null)}
        />
      )}

      {/* HEALTH CAROUSEL */}
      <div id="treatments">
        <HealthCarousel />
      </div>

      {/* EXPERIENCE */}
      <ExperienceSection />

      {/* WHY CHOOSE US */}
      <WhyChooseUs />

      {/* FOOTER */}
      <Footer />

    </div>
  );
}
