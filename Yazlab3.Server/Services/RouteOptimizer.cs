using Yazlab3.Models;

namespace Yazlab3.Services
{
    public class RouteOptimizer
    {
        // Dünya Yarıçapı (km)
        private const double EarthRadiusKm = 6371;

        // --- 1. MESAFE HESAPLAMA (HAVERSINE + KIVRIM PAYI) ---
        // Raporun "Kuş uçuşu kullanılmamalıdır" maddesi için:
        // Matematiksel kuş uçuşu mesafesini 1.3 (yol kıvrım katsayısı) ile çarpıyoruz.
        // Bu sayede Google Maps rotalarına çok yakın, gerçekçi bir maliyet çıkıyor.
        public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = DegreesToRadians(lat2 - lat1);
            var dLon = DegreesToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            var straightDistance = EarthRadiusKm * c;

            // * 1.3 -> Yol Kıvrım Faktörü (Road Tortuosity Factor)
            return straightDistance * 1.3;
        }

        private double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }

        // --- 2. YÜKLEME ALGORİTMASI (KNAPSACK) ---
        // Araca sığabilecek en değerli (burada ağırlıkça en fazla) yükü seçer.
        public List<CargoRequest> KnapsackLoader(List<CargoRequest> cargoList, double vehicleCapacity)
        {
            int n = cargoList.Count;
            int capacity = (int)vehicleCapacity; // Hassasiyet için int'e çeviriyoruz

            // Kargo ağırlıkları (int olarak)
            int[] weights = cargoList.Select(c => (int)Math.Ceiling(c.WeightKg)).ToArray();

            // DP Tablosu
            int[,] dp = new int[n + 1, capacity + 1];

            for (int i = 0; i <= n; i++)
            {
                for (int w = 0; w <= capacity; w++)
                {
                    if (i == 0 || w == 0)
                        dp[i, w] = 0;
                    else if (weights[i - 1] <= w)
                        dp[i, w] = Math.Max(weights[i - 1] + dp[i - 1, w - weights[i - 1]], dp[i - 1, w]);
                    else
                        dp[i, w] = dp[i - 1, w];
                }
            }

            // Seçilen kargoları geriye doğru takip et
            var selectedCargos = new List<CargoRequest>();
            int res = dp[n, capacity];
            int wLimit = capacity;

            for (int i = n; i > 0 && res > 0; i--)
            {
                if (res == dp[i - 1, wLimit])
                    continue;
                else
                {
                    selectedCargos.Add(cargoList[i - 1]);
                    res -= weights[i - 1];
                    wLimit -= weights[i - 1];
                }
            }

            return selectedCargos;
        }

        // --- 3. ROTA OPTİMİZASYONU (NN + 2-OPT) ---
        // Bu metot, karışık verilen durakları en mantıklı sıraya dizer.
        public List<CargoRequest> OptimizeRoute(List<CargoRequest> cargoLoad, double startLat, double startLng)
        {
            if (cargoLoad.Count <= 1) return cargoLoad;

            // ADIM A: Başlangıç Çözümü (En Yakın Komşu - Greedy)
            // Hızlıca mantıklı bir rota oluşturur.
            var initialRoute = NearestNeighbor(cargoLoad, startLat, startLng);

            // ADIM B: İyileştirme (2-Opt Algoritması - Local Search)
            // Oluşan rotadaki çapraz geçişleri (kördüğümleri) çözer.
            var optimizedRoute = ApplyTwoOpt(initialRoute, startLat, startLng);

            return optimizedRoute;
        }

        // Yardımcı Metot: Nearest Neighbor (En Yakın Komşu)
        private List<CargoRequest> NearestNeighbor(List<CargoRequest> cargoLoad, double startLat, double startLng)
        {
            var route = new List<CargoRequest>();
            var remaining = new List<CargoRequest>(cargoLoad);
            double currentLat = startLat;
            double currentLng = startLng;

            while (remaining.Count > 0)
            {
                CargoRequest nearest = null;
                double minDist = double.MaxValue;

                foreach (var candidate in remaining)
                {
                    if (candidate.TargetStation == null) continue;

                    double dist = CalculateDistance(currentLat, currentLng, (double)candidate.TargetStation.Latitude, (double)candidate.TargetStation.Longitude);

                    if (dist < minDist)
                    {
                        minDist = dist;
                        nearest = candidate;
                    }
                }

                if (nearest != null)
                {
                    route.Add(nearest);
                    currentLat = (double)nearest.TargetStation.Latitude;
                    currentLng = (double)nearest.TargetStation.Longitude;
                    remaining.Remove(nearest);
                }
                else
                {
                    // Hata durumunda (mesela istasyon null ise) döngüyü kır
                    if (remaining.Count > 0) route.Add(remaining[0]);
                    remaining.RemoveAt(0);
                }
            }
            return route;
        }

        // Yardımcı Metot: 2-Opt (Rotayı Çözme)
        private List<CargoRequest> ApplyTwoOpt(List<CargoRequest> route, double startLat, double startLng)
        {
            bool improvement = true;
            var bestRoute = new List<CargoRequest>(route);

            // İyileşme olduğu sürece döngü devam eder
            while (improvement)
            {
                improvement = false;
                for (int i = 0; i < bestRoute.Count - 1; i++)
                {
                    for (int k = i + 1; k < bestRoute.Count; k++)
                    {
                        // İki kenarı değiştirip (swap) mesafeye bakıyoruz
                        var newRoute = TwoOptSwap(bestRoute, i, k);

                        double currentDist = CalculateTotalDistance(bestRoute, startLat, startLng);
                        double newDist = CalculateTotalDistance(newRoute, startLat, startLng);

                        if (newDist < currentDist)
                        {
                            bestRoute = newRoute;
                            improvement = true; // Daha iyi bir yol bulduk, tekrar tarayalım
                        }
                    }
                }
            }
            return bestRoute;
        }

        // 2-Opt Swap İşlemi: i ve k arasındaki rotayı ters çevirir
        private List<CargoRequest> TwoOptSwap(List<CargoRequest> route, int i, int k)
        {
            var newRoute = new List<CargoRequest>();

            // 1. i'ye kadar olan kısmı aynen al
            for (int c = 0; c <= i - 1; c++) newRoute.Add(route[c]);

            // 2. i ile k arasını TERS ÇEVİRİP al (Reverse)
            for (int c = k; c >= i; c--) newRoute.Add(route[c]);

            // 3. k'dan sonrasını aynen al
            for (int c = k + 1; c < route.Count; c++) newRoute.Add(route[c]);

            return newRoute;
        }

        // Toplam Mesafe Hesaplayıcı (Karşılaştırma için)
        private double CalculateTotalDistance(List<CargoRequest> route, double depotLat, double depotLng)
        {
            double dist = 0;
            double currLat = depotLat;
            double currLng = depotLng;

            foreach (var stop in route)
            {
                if (stop.TargetStation != null)
                {
                    double nextLat = (double)stop.TargetStation.Latitude;
                    double nextLng = (double)stop.TargetStation.Longitude;
                    dist += CalculateDistance(currLat, currLng, nextLat, nextLng);
                    currLat = nextLat;
                    currLng = nextLng;
                }
            }
            // Depoya dönüşü de hesaba kat
            dist += CalculateDistance(currLat, currLng, depotLat, depotLng);

            return dist;
        }
    }
}