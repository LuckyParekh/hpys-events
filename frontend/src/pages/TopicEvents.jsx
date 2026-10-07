import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEvents } from "../lib/api";
import EventCard from "../components/EventCard";

export default function TopicEvents() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(topic);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents({ search: decoded }).then(setEvents).finally(() => setLoading(false));
  }, [decoded]);

  return (
    <div className="pb-28 pt-16 px-4">
      <button
        className="mt-4 mb-4 flex items-center gap-1 text-blue-400 text-sm"
        onClick={() => navigate(-1)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Topics
      </button>

      <h1 className="text-2xl font-bold text-white mb-5">{decoded}</h1>

      {loading && (
        <div className="flex justify-center mt-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800">
          {events.length === 0 && (
            <p className="text-gray-500 text-center py-10">No events found for this topic.</p>
          )}
          {events.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}
