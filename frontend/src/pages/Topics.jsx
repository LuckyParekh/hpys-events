import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTopics, getEvents } from "../lib/api";

export default function Topics() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopics().then(setTopics).finally(() => setLoading(false));
  }, []);

  const filtered = topics.filter((t) =>
    t.topic.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-28 pt-16 px-4">
      <div className="flex items-center justify-between mt-4 mb-4">
        <h1 className="text-2xl font-bold text-white">Topics</h1>
        <span className="text-gray-500 text-sm">{topics.length} total</span>
      </div>

      <input
        className="input mb-4"
        placeholder="Search topics…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && (
        <div className="flex justify-center mt-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800">
          {filtered.length === 0 && (
            <p className="text-gray-500 text-center py-10">No topics yet.</p>
          )}
          {filtered.map((t) => (
            <button
              key={t.topic}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors text-left"
              onClick={() => navigate(`/topics/${encodeURIComponent(t.topic)}`)}
            >
              <span className="text-white font-medium">{t.topic}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t.count} event{t.count !== 1 ? "s" : ""}</span>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
