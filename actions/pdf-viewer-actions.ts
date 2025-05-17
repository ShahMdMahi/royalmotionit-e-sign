"use server";

export async function handlePageChange(page: number) {
  // Server action wrapper for onPageChange
  return page;
}

export async function handleTotalPagesChange(pages: number) {
  // Server action wrapper for onTotalPagesChange
  return pages;
}
