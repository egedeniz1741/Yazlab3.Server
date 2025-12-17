using Yazlab3.Models;

namespace Yazlab3.Services
{
    public class RouteOptimizer
    {
        private const double EarthRadiusKm = 6371;

        // UMUTTEPE KOORDİNATLARI (SABİT HEDEF)
        private const double UmuttepeLat = 40.821768;
        private const double UmuttepeLng = 29.923476;

        // --- 1. AKILLI MESAFE HESABI (KÖRFEZ MANTIĞI) ---
        public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            // İzmit Merkez (Körfez Geçişi İçin Hub)
            double hubLat = 40.7654;
            double hubLng = 29.9408;

            bool isSourceNorth = IsNorthSide(lat1, lon1);
            bool isTargetNorth = IsNorthSide(lat2, lon2);
            bool isSourceSouth = IsSouthSide(lat1, lon1);
            bool isTargetSouth = IsSouthSide(lat2, lon2);

            // Körfez geçişi varsa İzmit üzerinden dolaş
            if ((isSourceNorth && isTargetSouth) || (isSourceSouth && isTargetNorth))
            {
                double distToHub = GetHaversineDistance(lat1, lon1, hubLat, hubLng);
                double distFromHub = GetHaversineDistance(hubLat, hubLng, lat2, lon2);
                return (distToHub + distFromHub) * 1.2;
            }

            return GetHaversineDistance(lat1, lon1, lat2, lon2) * 1.3;
        }

        private bool IsNorthSide(double lat, double lng) => lat > 40.745 && lng < 29.90;
        private bool IsSouthSide(double lat, double lng) => lat <= 40.745 && lng < 29.90;

        private double GetHaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = DegreesToRadians(lat2 - lat1);
            var dLon = DegreesToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) + Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadiusKm * c;
        }
        private double DegreesToRadians(double degrees) => degrees * Math.PI / 180;

        // --- 2. YÜKLEME (KNAPSACK) ---
        public List<CargoRequest> KnapsackLoader(List<CargoRequest> cargoList, double vehicleCapacity)
        {
            // (Knapsack kodu aynı kalıyor, kısalık için özet geçiyorum, aynısını kullan)
            int n = cargoList.Count;
            int capacity = (int)vehicleCapacity;
            int[] weights = cargoList.Select(c => (int)Math.Ceiling(c.WeightKg)).ToArray();
            int[,] dp = new int[n + 1, capacity + 1];

            for (int i = 0; i <= n; i++)
            {
                for (int w = 0; w <= capacity; w++)
                {
                    if (i == 0 || w == 0) dp[i, w] = 0;
                    else if (weights[i - 1] <= w) dp[i, w] = Math.Max(weights[i - 1] + dp[i - 1, w - weights[i - 1]], dp[i - 1, w]);
                    else dp[i, w] = dp[i - 1, w];
                }
            }
            var selected = new List<CargoRequest>();
            int res = dp[n, capacity], wLimit = capacity;
            for (int i = n; i > 0 && res > 0; i--)
            {
                if (res == dp[i - 1, wLimit]) continue;
                selected.Add(cargoList[i - 1]);
                res -= weights[i - 1]; wLimit -= weights[i - 1];
            }
            return selected;
        }

        // --- 3. ROTA OPTİMİZASYONU (TOPLAMA MODELİ) ---
        // ARTIK DEPO YOK. İlk kargo noktası başlangıçtır.
        public List<CargoRequest> OptimizeRoute(List<CargoRequest> cargoLoad, double startLat, double startLng)
        {
            if (cargoLoad.Count == 0) return cargoLoad;

            // En Yakın Komşu ile sırala
            var initialRoute = NearestNeighborCollection(cargoLoad);

            // 2-Opt ile iyileştir
            var optimizedRoute = ApplyTwoOpt(initialRoute);

            return optimizedRoute;
        }

        private List<CargoRequest> NearestNeighborCollection(List<CargoRequest> cargoLoad)
        {
            var route = new List<CargoRequest>();
            var remaining = new List<CargoRequest>(cargoLoad);

            // İLK DURAK MANTIĞI:
            // Listede gelen ilk kargoyu başlangıç noktası kabul et.
            // (Veya en uzaktakini seçebilirsin ama ilk gelen mantıklıdır)
            var current = remaining[0];
            route.Add(current);
            remaining.RemoveAt(0);

            while (remaining.Count > 0)
            {
                CargoRequest nearest = null;
                double minDist = double.MaxValue;
                double cLat = (double)current.TargetStation.Latitude;
                double cLng = (double)current.TargetStation.Longitude;

                foreach (var candidate in remaining)
                {
                    double dist = CalculateDistance(cLat, cLng, (double)candidate.TargetStation.Latitude, (double)candidate.TargetStation.Longitude);
                    if (dist < minDist) { minDist = dist; nearest = candidate; }
                }

                if (nearest != null) { route.Add(nearest); current = nearest; remaining.Remove(nearest); }
            }
            return route;
        }

        private double CalculateTotalDistance(List<CargoRequest> route)
        {
            double dist = 0;
            if (route.Count == 0) return 0;

            // Duraklar arası mesafe
            for (int i = 0; i < route.Count - 1; i++)
            {
                var s1 = route[i].TargetStation;
                var s2 = route[i + 1].TargetStation;
                dist += CalculateDistance((double)s1.Latitude, (double)s1.Longitude, (double)s2.Latitude, (double)s2.Longitude);
            }

            // SON DURAKTAN -> UMUTTEPE'YE GİDİŞ
            var last = route.Last().TargetStation;
            dist += CalculateDistance((double)last.Latitude, (double)last.Longitude, UmuttepeLat, UmuttepeLng);

            return dist;
        }

        private List<CargoRequest> ApplyTwoOpt(List<CargoRequest> route)
        {
            bool improvement = true;
            var bestRoute = new List<CargoRequest>(route);
            while (improvement)
            {
                improvement = false;
                for (int i = 0; i < bestRoute.Count - 1; i++)
                {
                    for (int k = i + 1; k < bestRoute.Count; k++)
                    {
                        var newRoute = TwoOptSwap(bestRoute, i, k);
                        if (CalculateTotalDistance(newRoute) < CalculateTotalDistance(bestRoute))
                        {
                            bestRoute = newRoute; improvement = true;
                        }
                    }
                }
            }
            return bestRoute;
        }

        private List<CargoRequest> TwoOptSwap(List<CargoRequest> route, int i, int k)
        {
            var newRoute = new List<CargoRequest>();
            for (int c = 0; c <= i - 1; c++) newRoute.Add(route[c]);
            for (int c = k; c >= i; c--) newRoute.Add(route[c]);
            for (int c = k + 1; c < route.Count; c++) newRoute.Add(route[c]);
            return newRoute;
        }
    }
}