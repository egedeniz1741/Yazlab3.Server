using Yazlab3.Models;

namespace Yazlab3.Services
{
    public class RouteOptimizer
    {
        private const double EarthRadiusKm = 6371;

        // --- 1. AKILLI MESAFE HESABI (KÖRFEZ MANTIĞI) ---
        public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            // İzmit Merkez Koordinatları (Köprü/Düğüm Noktası)
            double hubLat = 40.7654;
            double hubLng = 29.9408;

            // Kuzey ve Güney yakası kontrolü
            bool isSourceNorth = IsNorthSide(lat1, lon1);
            bool isTargetNorth = IsNorthSide(lat2, lon2);
            bool isSourceSouth = IsSouthSide(lat1, lon1);
            bool isTargetSouth = IsSouthSide(lat2, lon2);

            // DURUM 1: KÖRFEZ GEÇİŞİ GEREKİYORSA (Biri Kuzeyde, Biri Güneyde)
            // Bu durumda kuş uçuşu gidemez, İzmit Merkez (Hub) üzerinden dolaşmalı.
            if ((isSourceNorth && isTargetSouth) || (isSourceSouth && isTargetNorth))
            {
                // Rota: A -> İzmit -> B
                double distToHub = GetHaversineDistance(lat1, lon1, hubLat, hubLng);
                double distFromHub = GetHaversineDistance(hubLat, hubLng, lat2, lon2);

                // 1.2 faktörü: Anayol olduğu için kıvrım azdır ama yol uzundur.
                return (distToHub + distFromHub) * 1.2;
            }

            // DURUM 2: AYNI YAKA VEYA DOĞU TARAFI (Normal Yol)
            // 1.3 faktörü: Şehir içi yolların kıvrım payı.
            return GetHaversineDistance(lat1, lon1, lat2, lon2) * 1.3;
        }

        // Kuzey Yakası Tanımı (Gebze, Dilovası, Körfez, Derince tarafları)
        // Enlem 40.74'ten büyük ve Boylam 29.90'dan küçük olan yerler
        private bool IsNorthSide(double lat, double lng)
        {
            return lat > 40.745 && lng < 29.90;
        }

        // Güney Yakası Tanımı (Gölcük, Karamürsel, Başiskele tarafları)
        private bool IsSouthSide(double lat, double lng)
        {
            return lat <= 40.745 && lng < 29.90;
        }

        // Saf Matematiksel Hesap (Haversine Formülü)
        private double GetHaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = DegreesToRadians(lat2 - lat1);
            var dLon = DegreesToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadiusKm * c;
        }

        private double DegreesToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }

        // --- 2. YÜKLEME ALGORİTMASI (KNAPSACK) ---
        public List<CargoRequest> KnapsackLoader(List<CargoRequest> cargoList, double vehicleCapacity)
        {
            int n = cargoList.Count;
            int capacity = (int)vehicleCapacity;
            int[] weights = cargoList.Select(c => (int)Math.Ceiling(c.WeightKg)).ToArray();
            int[,] dp = new int[n + 1, capacity + 1];

            for (int i = 0; i <= n; i++)
            {
                for (int w = 0; w <= capacity; w++)
                {
                    if (i == 0 || w == 0) dp[i, w] = 0;
                    else if (weights[i - 1] <= w)
                        dp[i, w] = Math.Max(weights[i - 1] + dp[i - 1, w - weights[i - 1]], dp[i - 1, w]);
                    else
                        dp[i, w] = dp[i - 1, w];
                }
            }

            var selectedCargos = new List<CargoRequest>();
            int res = dp[n, capacity];
            int wLimit = capacity;

            for (int i = n; i > 0 && res > 0; i--)
            {
                if (res == dp[i - 1, wLimit]) continue;
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
        public List<CargoRequest> OptimizeRoute(List<CargoRequest> cargoLoad, double startLat, double startLng)
        {
            if (cargoLoad.Count <= 1) return cargoLoad;
            var initialRoute = NearestNeighbor(cargoLoad, startLat, startLng);
            var optimizedRoute = ApplyTwoOpt(initialRoute, startLat, startLng);
            return optimizedRoute;
        }

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
                    if (dist < minDist) { minDist = dist; nearest = candidate; }
                }

                if (nearest != null)
                {
                    route.Add(nearest);
                    currentLat = (double)nearest.TargetStation.Latitude;
                    currentLng = (double)nearest.TargetStation.Longitude;
                    remaining.Remove(nearest);
                }
                else { if (remaining.Count > 0) route.Add(remaining[0]); remaining.RemoveAt(0); }
            }
            return route;
        }

        private List<CargoRequest> ApplyTwoOpt(List<CargoRequest> route, double startLat, double startLng)
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
                        double currentDist = CalculateTotalDistance(bestRoute, startLat, startLng);
                        double newDist = CalculateTotalDistance(newRoute, startLat, startLng);

                        if (newDist < currentDist)
                        {
                            bestRoute = newRoute;
                            improvement = true;
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
            dist += CalculateDistance(currLat, currLng, depotLat, depotLng);
            return dist;
        }
    }
}