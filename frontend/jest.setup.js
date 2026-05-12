require("@testing-library/jest-dom");
const { cleanup } = require("@testing-library/react");
const { createElement } = require("react");

// jsdom no Node 20+ não expõe localStorage funcional no window.
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] ?? null,
        setItem: (key, value) => { store[key] = value; },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (index) => Object.keys(store)[index] ?? null,
    };
})();

beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: false,
    });
});

// Mock next/image — retorna função nomeada para que React aceite como componente
jest.mock("next/image", () => ({
    __esModule: true,
    default: function MockImage({ src, alt, width, height, fill, priority, unoptimized, ...rest }) {
        const resolvedSrc = typeof src === "object" ? (src.src || "") : src;
        return createElement("img", { src: resolvedSrc, alt, width, height, ...rest });
    },
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
    cleanup();
    localStorage.clear();
});
