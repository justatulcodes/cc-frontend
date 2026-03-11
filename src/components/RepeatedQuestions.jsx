import React from 'react';
import { formatInt } from '../utils';

function QuestionSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div
            className="h-4 rounded"
            style={{
              width: "75%",
              backgroundColor: "var(--primary-border)",
              borderRadius: "var(--rq-skeleton-rounded)"
            }}
          ></div>
          <div
            className="h-4 rounded"
            style={{
              width: "50%",
              backgroundColor: "var(--primary-border)",
              borderRadius: "var(--rq-skeleton-rounded)"
            }}
          ></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-center">
          <div
            className="h-6 w-16 rounded-full"
            style={{ backgroundColor: "var(--primary-border)" }}
          ></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex justify-center">
          <div
            className="h-6 w-24 rounded-full"
            style={{ backgroundColor: "var(--primary-border)" }}
          ></div>
        </div>
      </td>
    </tr>
  );
}

export default function RepeatedQuestions({ questions, loading = false, isAIEnhanced = false }) {
  return (
    <div
      className="rounded-xl p-6 mb-8 overflow-hidden"
      style={{
        backgroundColor: "var(--primary-bg)",
        border: `1px solid var(--primary-border)`
      }}
    >
      <div className="mb-3">
        <div className="flex items-center gap-3">
          <h4
            className="text-lg font-semibold mt-3"
            style={{ color: "var(--primary-text)" }}
          >
            Top Repeated Questions
          </h4>
          {loading && (
            <span
              className="text-sm mt-3"
              style={{ color: "var(--secondary-text)" }}
            >
              ⏳ Clustering Questions...
            </span>
          )}
        </div>
      </div>

      <div
        className="rounded-xl overflow-x-auto"
        style={{ backgroundColor: "var(--color-gray-100)", border: `1px solid var(--primary-border)` }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "var(--secondary-bg)" }}>
              <th
                className="text-left px-6 py-4 text-sm font-medium w-3/5"
                style={{ color: "var(--primary-text)" }}
              >
                Questions (normalised)
              </th>
              <th
                className="text-center px-6 py-4 text-sm font-medium w-1/5"
                style={{ color: "var(--primary-text)" }}
              >
                Count
              </th>
              <th
                className="text-center px-6 py-4 text-sm font-medium w-1/5"
                style={{ color: "var(--primary-text)" }}
              >
                Category
              </th>
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, idx) => <QuestionSkeleton key={idx} />)
              : questions.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-center text-sm"
                    style={{ color: "var(--secondary-text)" }}
                  >
                    AI-clustered questions will appear here once generated
                  </td>
                </tr>
              ) : (
                questions.slice(0, 10).map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:transition-colors"
                    style={{ backgroundColor: "transparent" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--rq-table-row-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td
                      className="px-6 py-2 text-sm leading-relaxed"
                      style={{ color: "var(--primary-text)" }}
                    >
                      {item.question}
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      <span
                        className="inline-flex items-center justify-center px-4 py-1 rounded-full text-sm font-medium min-w-12"
                        style={{
                          backgroundColor: "var(--color-green-200)",
                          color: "var(--color-green-900)"
                        }}
                      >
                        {formatInt(item.count)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center align-middle">
                      <span
                        className="inline-flex items-center justify-center px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap capitalize"
                        style={{
                          backgroundColor: "var(--color-green-300)",
                          color: "var(--color-green-900)"
                        }}
                      >
                        {item.category.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
