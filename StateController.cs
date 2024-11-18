namespace BotWhatsAppUI;

public static class TimerState
{
    public static System.Timers.Timer MyTimer;

    public static void StopTimer()
    {
        if (MyTimer != null)
        {
            MyTimer.Stop();
            Console.WriteLine("Timer stopped due to focus loss");
        }
    }
    public static void StartTimer()
    {
        if (MyTimer != null)
        {
            MyTimer.Start();
            Console.WriteLine("Timer started due to focus gain");
        }
    }
}