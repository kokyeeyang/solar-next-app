import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DashboardPage from "../src/app/dashboard/page"; // Adjust if your path differs
import '@testing-library/jest-dom';
import { Response } from 'node-fetch';

(global as any).Response = Response;

describe("FilterModal integration in DashboardPage", () => {
  beforeAll(() => {
    // Inject #modal-root for ReactDOM.createPortal to work
    const modalRoot = document.createElement("div");
    modalRoot.setAttribute("id", "modal-root");
    document.body.appendChild(modalRoot);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Global fetch mock
   global.fetch = jest.fn((url: RequestInfo) => {
  if (
    typeof url === "string" &&
    url.includes("metric=headcount") &&
    url.includes("output=total")
  ) {
    const mockHeadcount = [
      {
        DealboardTeam: "Brogram",
        Function: "Contract",
        Office: "London",
        Region: "EMEA",
        RevenueStream: "Perm",
        Sector: "Energy",
        Team: "Alpha",
      },
      {
        DealboardTeam: "Downstream Cowboys",
        Function: "Permanent",
        Office: "Singapore",
        Region: "APAC",
        RevenueStream: "Contract",
        Sector: "Oil",
        Team: "Beta",
      },
    ];

    return Promise.resolve(
      new Response(JSON.stringify(mockHeadcount), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  }

  if (typeof url === "string" && url.includes("breadcrumbs.php")) {
    const mockConsultants = {
      ActiveConsultantsList: [
        { name: "Alice Smith", bullhornID: "123" },
        { name: "Bob Jones", bullhornID: "456" },
      ],
    };

    return Promise.resolve(
      new Response(JSON.stringify(mockConsultants), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  }

  if (typeof url === "string" && url.includes("metric=") && url.includes("output=total")) {
    return Promise.resolve(
      new Response(JSON.stringify({ total: 42, target: 100 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  }

  console.warn("❌ Unhandled fetch URL:", url);
  return Promise.reject(new Error(`Unhandled fetch URL: ${url}`));
}) as jest.Mock;

  });

  afterAll(() => {
    const modalRoot = document.getElementById("modal-root");
    if (modalRoot) {
      document.body.removeChild(modalRoot);
    }
  });

  it("opens FilterModal and shows dropdown options", async () => {
    render(<DashboardPage />);

    // Wait for initial data to load
    await screen.findByText("Filters");

    // Click to open the modal
    fireEvent.click(screen.getByText("Filters"));

    // Wait for modal to appear
    await screen.findByText("Filter Options");

    // Open DealboardTeam dropdown
    fireEvent.click(screen.getByText(/Please select dealboard team/i));

    // Wait for options to be visible
    await waitFor(() => {
      expect(screen.getByText("Brogram")).toBeInTheDocument();
      expect(screen.getByText("Downstream Cowboys")).toBeInTheDocument();
    });

    // Check that the Consultant dropdown is present
    expect(screen.getByText(/Please select consultant/i)).toBeInTheDocument();
  });
});
