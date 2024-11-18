using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.JSInterop;

namespace BotWhatsAppUI.Services;


public class PhoneErrorModel
{
    public string ErrorNumber {get;set;}
    public string message {get;set;}
}

public class MessageResponseModel
{
    public int Sended {get;set;}
    public int TotalErrors {get;set;}
    public List<PhoneErrorModel> AllErrors {get;set;} = new List<PhoneErrorModel>();
}

public class AutoResponseModel
{
    public string Message {get;set;}
}

public class WhatsAppService
{
    private readonly HttpClient request;
    private readonly IJSRuntime json;

    public WhatsAppService(HttpClient _request, IJSRuntime _json)
    {
        request = _request;
        json = _json;
    }

    public async Task<byte[]> GetQrCodeAsync()
    {
        try
        { 
            var response = await request.GetAsync("api/qr-code");
            if (response.IsSuccessStatusCode)
            {
                var qrCodeImage = await response.Content.ReadAsByteArrayAsync();
                return qrCodeImage;
            }
            else
            {
                Console.WriteLine("QR code não está disponível. Status code: " + response.StatusCode); 
                return null;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Erro ao obter o QR code: " + ex.Message); 
            return null;
        }
    }
    public async Task<MessageResponseModel> SendMessageAsync(List<string> numbers, string message)
    {
        try
        {
            var payload = new
            {
                numbers = numbers,
                message = message
            };
            var response = await request.PostAsJsonAsync("api/send_message", payload);
            response.EnsureSuccessStatusCode();
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("Mensagem enviada com sucesso");
                return await response.Content.ReadFromJsonAsync<MessageResponseModel>();
            }
            else
            {
                Console.WriteLine($"Erro ao enviar a mensagem. Status code: {response.StatusCode}");
                return null;
            }
        } catch (Exception ex)
        {
            Console.WriteLine("Erro ao enviar a mensagem: " + ex.Message); 
            return null;
        }
    }
    public async Task<AutoResponseModel> GetAutoResponse()
    {
        try
        {
            var response = await request.GetAsync("api/auto-response");
            response.EnsureSuccessStatusCode();
            if(response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<AutoResponseModel>();
            }
            else
            {
                Console.WriteLine("Error ao obter mensagem");
                return null;
            }
        }
        catch(Exception error)
        {
            Console.WriteLine(error.Message);
            return null;
        }
    }

    public async Task<bool> SetAutoResponseAsync(string autoResponse)
    {
        try
        {
            var payload = new { AutoResponse = autoResponse};
            var response = await request.PostAsJsonAsync("api/auto-response", payload);
            response.EnsureSuccessStatusCode();
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("Mensagem automática salva com sucesso");
                return true;
            }
            else
            {
                Console.WriteLine("Falha ao salvar mensagem automática");
                return false;
            }
        }
        catch(Exception ex)
        {
            Console.WriteLine(ex.Message);
            return false;
        }
    }
}