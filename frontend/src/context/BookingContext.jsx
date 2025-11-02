import { createContext } from "react";

// Export only the context object from this file so the provider (component)
// can live in a separate module. This avoids mixing non-component exports
// with components and satisfies fast-refresh lint rules.
export const BookingContext = createContext();
