import React, { useState, useEffect } from 'react';

// Coordinates for major cities on a 1200x615 image
const cities = [
    { name: 'İstanbul', x: 300, y: 150 },
    { name: 'Ankara', x: 510, y: 270 },
    { name: 'İzmir', x: 210, y: 330 },
    { name: 'Antalya', x: 405, y: 480 },
    { name: 'Bursa', x: 315, y: 210 },
    { name: 'Adana', x: 645, y: 465 },
    { name: 'Gaziantep', x: 750, y: 472.5 },
    { name: 'Trabzon', x: 870, y: 180 },
    { name: 'Erzurum', x: 945, y: 270 },
    { name: 'Diyarbakır', x: 900, y: 390 },
    { name: 'Konya', x: 525, y: 375 },
    { name: 'Kayseri', x: 660, y: 337.5 },
    { name: 'Samsun', x: 720, y: 150 },
    { name: 'Eskişehir', x: 400, y: 250 },
    { name: 'Denizli', x: 310, y: 400 },
    { name: 'Şanlıurfa', x: 830, y: 470 },
    { name: 'Mersin', x: 590, y: 500 },
    { name: 'Van', x: 1080, y: 360 },
    { name: 'Malatya', x: 790, y: 350 },
    { name: 'Tekirdağ', x: 230, y: 150 },
    { name: 'Aydın', x: 260, y: 380 },
    { name: 'Kocaeli', x: 360, y: 170 },
    { name: 'Sakarya', x: 390, y: 180 },
    { name: 'Muğla', x: 280, y: 460 },
    { name: 'Balıkesir', x: 250, y: 240 },
    { name: 'Manisa', x: 240, y: 310 },
    { name: 'Sivas', x: 750, y: 270 },
    { name: 'Kahramanmaraş', x: 720, y: 410 },
    { name: 'Rize', x: 920, y: 170 },
    { name: 'Hatay', x: 700, y: 550 },
    { name: 'Mardin', x: 930, y: 450 },
    { name: 'Ordu', x: 800, y: 160 },
    { name: 'Afyonkarahisar', x: 400, y: 330 },
    { name: 'Edirne', x: 180, y: 130 },
    { name: 'Isparta', x: 410, y: 410 },
    { name: 'Kütahya', x: 340, y: 280 },
    { name: 'Çanakkale', x: 180, y: 220 },
    { name: 'Zonguldak', x: 480, y: 130 },
    { name: 'Elazığ', x: 850, y: 340 },
    { name: 'Ağrı', x: 1070, y: 280 },
    { name: 'Nevşehir', x: 600, y: 330 },
    { name: 'Kars', x: 1050, y: 220 },
];

interface Sale {
    id: number;
    city: typeof cities[0];
}

const TurkeyMap: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);

    useEffect(() => {
        const initialSales: Sale[] = [];
        // To ensure a good distribution, we'll use a shuffled list of cities
        const shuffledCities = [...cities].sort(() => 0.5 - Math.random());

        for (let i = 0; i < 45; i++) {
            // We loop through the shuffled city list to distribute dots
            // This is better than pure random which can cluster dots.
            const city = shuffledCities[i % shuffledCities.length];
            initialSales.push({
                id: i, // A simple index is fine for a static list
                city: city,
            });
        }
        setSales(initialSales);
    }, []); // Empty dependency array means this runs only once on mount

    return (
        <div className="text-center">
            <h2 className="text-3xl font-bold text-white tracking-tight">Türkiye Genelinde Aktif Abonelikler</h2>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-metallic-400">
                Platformumuza Türkiye'nin dört bir yanından katılan on binlerce memnun müşterimizden sadece birkaçı.
            </p>
            <div className="mt-10 relative">
                <div className="relative max-w-4xl mx-auto aspect-[1200/615] bg-white/[0.03] backdrop-blur-3xl border border-white/20 rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Turkey_provinces_blank_gray.svg/1600px-Turkey_provinces_blank_gray.svg.png"
                        alt="Türkiye Haritası"
                        className="absolute inset-0 w-full h-full object-contain opacity-20 invert"
                    />
                    <svg viewBox="0 0 1200 615" className="absolute inset-0 w-full h-full" aria-hidden="true">
                        <g>
                            {sales.map(sale => (
                                <g key={sale.id} transform={`translate(${sale.city.x}, ${sale.city.y})`}>
                                    {/* Outer pulsing ring */}
                                    <circle
                                        r="8"
                                        fill="none"
                                        stroke="#6366f1"
                                        strokeWidth="3"
                                    >
                                        <animate
                                            attributeName="r"
                                            from="8"
                                            to="25"
                                            dur="1.8s"
                                            begin={`${Math.random().toFixed(2)}s`}
                                            repeatCount="indefinite"
                                        />
                                        <animate
                                            attributeName="opacity"
                                            from="1"
                                            to="0"
                                            dur="1.8s"
                                            begin={`${Math.random().toFixed(2)}s`}
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                    {/* Inner solid dot */}
                                    <circle
                                        r="7"
                                        fill="#818cf8"
                                        stroke="#ffffff"
                                        strokeWidth="2.5"
                                    />
                                </g>
                            ))}
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default TurkeyMap;