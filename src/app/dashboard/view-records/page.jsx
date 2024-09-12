"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../../context/userContext";
import { fetchLabReportsByUserId } from "../../../lib/supabaseHelpers";
import { Spinner } from "../../../components/Spinner";

export default function ViewRecordsPage() {
  const { user, loading } = useUser();
  const [labReports, setLabReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true); // New loading state

  useEffect(() => {
    const fetchReports = async () => {
      try {
        if (user?.role === "labuser") {
          setIsLoading(true);
          const reports = await fetchLabReportsByUserId(user.id);
          setLabReports(reports);
        }
      } catch (error) {
        console.error("Error fetching lab reports:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  if (loading || isLoading) {
    return <Spinner />;
  }

  if (!user) {
    return null;
  }

  const filteredReports = labReports.filter(
    (report) =>
      report.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold text-[#089bab] mb-4">Sent Lab Reports</h2>
      <input
        type="text"
        placeholder="Search by patient name or title..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border border-gray-300 p-2 rounded-lg w-full mb-4"
      />

      <div className="space-y-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white shadow rounded-lg p-6 flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-bold text-black">{report.title}</h3>
                <p className="text-gray-600">Patient: {report.patientName}</p>
                <p className="text-gray-600">Sent: {new Date(report.sendTime).toLocaleString()}</p>
              </div>
              <div>
                <a
                  href={report.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="bg-[#089bab] text-white py-2 px-4 rounded hover:bg-white hover:text-[#089bab] border border-[#089bab] transition-colors">
                    View Report
                  </button>
                </a>
              </div>
            </div>
          ))
        ) : (
          <p>No lab reports found.</p>
        )}
      </div>
    </div>
  );
}
