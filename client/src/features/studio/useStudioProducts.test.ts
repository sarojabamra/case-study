import { act, renderHook, waitFor } from "@testing-library/react";

import { useStudioProductActions, useStudioProducts } from "@/features/studio/useStudioProducts";
import { api } from "@/services/api";

jest.mock("@/services/api", () => ({ api: jest.fn() }));
const mockApi = jest.mocked(api);

beforeEach(() => {
  mockApi.mockReset();
  mockApi.mockResolvedValue([]);
});

test("loads the requested inventory page and refreshes all studio dashboard queries", async () => {
  const { result } = renderHook(() => useStudioProducts("Brand & Co", 2, 10));
  await waitFor(() => expect(result.current.productsQuery.isPending).toBe(false));
  expect(mockApi).toHaveBeenCalledWith("/Brand%20%26%20Co/products?skip=10&limit=11");
  expect(mockApi).toHaveBeenCalledWith("/Brand%20%26%20Co/products/low-stock");
  expect(mockApi).toHaveBeenCalledWith("/Brand%20%26%20Co/studio/summary");
  mockApi.mockClear();
  await act(async () => { await result.current.reload(); });
  expect(mockApi).toHaveBeenCalledTimes(3);
});

test("does not fetch without a brand", () => {
  renderHook(() => useStudioProducts("", 1, 10));
  expect(mockApi).not.toHaveBeenCalled();
});

test("stock updates send only quantity and propagate failures to the editor", async () => {
  const { result } = renderHook(() => useStudioProductActions("Nike"));
  await result.current.updateProduct(7, { quantity: 5 });
  expect(mockApi).toHaveBeenCalledWith("/Nike/products/7", {
    method: "PUT", body: JSON.stringify({ quantity: 5 }),
  });
  const error = new Error("Cannot delete a product in order history");
  mockApi.mockRejectedValueOnce(error);
  await expect(result.current.removeProduct(7)).rejects.toBe(error);
});
