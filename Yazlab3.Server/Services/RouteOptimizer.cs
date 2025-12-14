using System;
using System.Collections.Generic;
using System.Linq;
using Yazlab3.Models;

namespace Yazlab3.Services
{
    public class RouteOptimizer
    {
        // Matematiksel hesaplar için Dünya'nın yarıçapı (km)
        private const double EarthRadiusKm = 6371;

        // 1. Yardımcı Metot: İki nokta arası mesafe (Haversine Formülü)
        // PDF Madde 37: Yol maliyeti km başına 1 birimdir.
        // Kuş uçuşu hesap yasak olsa da, gerçek yol verisi olmadığı için
        // algoritmayı kurarken şimdilik bu formülü "tahmini yol" olarak kullanacağız.
        // Daha sonra bunu "x 1.5" yaparak yol kıvrımlarını simüle edebiliriz.
        public double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
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

        // 2. Algoritma: 0/1 Knapsack (Sırt Çantası) Problemi
        // PDF Madde 33: "Minimum maliyet maksimum kargo"
        // Belirli sayıda araç varken (Limited), araca en değerli (burada en ağır veya çok sayıda)
        // yükü sığdırmak için kullanılır.
        public List<CargoRequest> KnapsackLoader(List<CargoRequest> requests, double maxCapacity)
        {
            int n = requests.Count;
            int capacity = (int)maxCapacity; // DP matrisi için int'e çeviriyoruz

            // Ağırlıkları tam sayı kabul ediyoruz (algoritma performansı için)
            int[] weights = requests.Select(r => (int)r.WeightKg).ToArray();

            // Değer olarak da ağırlığı kullanıyoruz (Amacımız max yük taşımak)
            // İstersek buraya "Önem Derecesi" gibi bir puan da koyabiliriz.
            int[] values = requests.Select(r => (int)r.WeightKg).ToArray();

            int[,] dp = new int[n + 1, capacity + 1];

            // Tabloyu doldur
            for (int i = 0; i <= n; i++)
            {
                for (int w = 0; w <= capacity; w++)
                {
                    if (i == 0 || w == 0)
                        dp[i, w] = 0;
                    else if (weights[i - 1] <= w)
                        dp[i, w] = Math.Max(values[i - 1] + dp[i - 1, w - weights[i - 1]], dp[i - 1, w]);
                    else
                        dp[i, w] = dp[i - 1, w];
                }
            }

            // Seçilen kargoları geriye dönük bulma
            List<CargoRequest> selectedCargos = new List<CargoRequest>();
            int res = dp[n, capacity];
            int wLimit = capacity;

            for (int i = n; i > 0 && res > 0; i--)
            {
                // Eğer değer bir üst satırdan gelmiyorsa, bu kargo seçilmiş demektir
                if (res != dp[i - 1, wLimit])
                {
                    selectedCargos.Add(requests[i - 1]);
                    res -= values[i - 1];
                    wLimit -= weights[i - 1];
                }
            }

            return selectedCargos;
        }
    }
}