export type particleStyleType = {
    image?: any;
    startScale?: number;
    endScale?: number;
    minimumParticleLife?: number;
    maximumParticleLife?: number;
    minimumSpeed?: number;
    maximumSpeed?: number;
    particleSize?: number;
    emissionRate?: number;
    gravity?: number;
    pitch?: number;
    heading?: number;
};

export type eventFuncType = (...args: any[]) => void;
