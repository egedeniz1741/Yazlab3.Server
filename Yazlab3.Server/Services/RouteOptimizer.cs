using Yazlab3.Models;

namespace Yazlab3.Services
{
    public class RouteOptimizer
    {
        private const double EarthRadiusKm = 6371;

     
        private const double UmuttepeLat = 40.821768;
        private const double UmuttepeLng = 29.923476;

        
        private const double BridgeNorthLat = 40.7745;
        private const double BridgeNorthLng = 29.5295;
   
        private const double BridgeSouthLat = 40.7410;
        private const double BridgeSouthLng = 29.5110;
        
        private const double BridgeDistanceKm = 4.0;

  
        private const double IzmitHubLat = 40.7654;
        private const double IzmitHubLng = 29.9408;

      
        public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            bool isSourceNorth = IsNorthSide(lat1);
            bool isTargetNorth = IsNorthSide(lat2);

          
            if (isSourceNorth == isTargetNorth)
            {
                return GetHaversineDistance(lat1, lon1, lat2, lon2) * 1.2; 
            }

           
            double distToIzmit = GetHaversineDistance(lat1, lon1, IzmitHubLat, IzmitHubLng);
            double distFromIzmit = GetHaversineDistance(IzmitHubLat, IzmitHubLng, lat2, lon2);
            double totalViaIzmit = (distToIzmit + distFromIzmit) * 1.2;

           
            double northPointLat = isSourceNorth ? lat1 : lat2;
            double northPointLng = isSourceNorth ? lon1 : lon2;
            double southPointLat = isSourceNorth ? lat2 : lat1;
            double southPointLng = isSourceNorth ? lon2 : lon1;

            double distToBridgeNorth = GetHaversineDistance(northPointLat, northPointLng, BridgeNorthLat, BridgeNorthLng);
            double distToBridgeSouth = GetHaversineDistance(southPointLat, southPointLng, BridgeSouthLat, BridgeSouthLng);

           
            double totalViaBridge = (distToBridgeNorth * 1.2) + BridgeDistanceKm + (distToBridgeSouth * 1.2);

           
            return Math.Min(totalViaIzmit, totalViaBridge);
        }

       
        private bool IsNorthSide(double lat) => lat > 40.758;

        private double GetHaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = DegreesToRadians(lat2 - lat1);
            var dLon = DegreesToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) + Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return EarthRadiusKm * c;
        }
        private double DegreesToRadians(double degrees) => degrees * Math.PI / 180;

    
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

        public List<CargoRequest> OptimizeRoute(List<CargoRequest> cargoLoad, double startLat, double startLng)
        {
            if (cargoLoad.Count == 0) return cargoLoad;

       
            var initialRoute = NearestNeighborCollection(cargoLoad);

          
            var optimizedRoute = ApplyTwoOpt(initialRoute);

            return optimizedRoute;
        }

        private List<CargoRequest> NearestNeighborCollection(List<CargoRequest> cargoLoad)
        {
            var route = new List<CargoRequest>();
            var remaining = new List<CargoRequest>(cargoLoad);

         

            var current = remaining.OrderBy(c => c.TargetStation.Longitude).First();

            route.Add(current);
            remaining.Remove(current);

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

            for (int i = 0; i < route.Count - 1; i++)
            {
                var s1 = route[i].TargetStation;
                var s2 = route[i + 1].TargetStation;
                dist += CalculateDistance((double)s1.Latitude, (double)s1.Longitude, (double)s2.Latitude, (double)s2.Longitude);
            }

            var last = route.Last().TargetStation;
            dist += CalculateDistance((double)last.Latitude, (double)last.Longitude, UmuttepeLat, UmuttepeLng);

            return dist;
        }

        private List<CargoRequest> ApplyTwoOpt(List<CargoRequest> route)
        {
            bool improvement = true;
            var bestRoute = new List<CargoRequest>(route);
            int maxIterations = 50; 
            int iter = 0;

            while (improvement && iter < maxIterations)
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
                iter++;
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