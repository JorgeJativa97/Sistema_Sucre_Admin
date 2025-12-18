declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'swiper/swiper-bundle.css';
declare module 'flatpickr/dist/flatpickr.css';