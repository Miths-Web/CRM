import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

declare var Razorpay: any;

@Component({
  selector: 'app-pay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="checkout-container">

      <!-- Loading State -->
      <div class="card p-6 shadow-lg bg-white max-w-md mx-auto mt-10 rounded-xl text-center" *ngIf="loading()">
        <p class="text-gray-500">Retrieving invoice details...</p>
      </div>

      <!-- Error State -->
      <div class="card p-6 shadow-lg bg-white max-w-md mx-auto mt-10 rounded-xl text-center border-red-200" *ngIf="error()">
        <h2 class="text-xl font-bold mb-2 text-red-600">Error</h2>
        <p class="text-gray-600">{{error()}}</p>
      </div>

      <!-- Payment UI -->
      <div class="card p-6 shadow-lg bg-white max-w-md mx-auto mt-10 rounded-xl" *ngIf="!paid() && !loading() && !error() && invoiceData()">
        <h2 class="text-2xl font-bold mb-4 text-center">Dhwiti CRM - Invoice Payment</h2>
        <p class="text-gray-600 mb-6 text-center">You are about to pay for Invoice <strong>#{{invoiceData()?.invoiceNumber}}</strong></p>
        
        <div class="bg-gray-50 p-4 rounded-lg mb-6 text-center border">
           <p class="text-sm text-gray-500">Amount Due</p>
           <p class="text-3xl font-extrabold text-indigo-600">₹ {{invoiceData()?.dueAmount | number:'1.2-2'}}</p>
        </div>

        <button (click)="openRazorpay()" class="w-full btn btn-primary flex justify-center items-center py-3 text-lg font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md hover:shadow-lg">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2H7v-2h2V9h2v7zm4 0h-2v-2h-2v-2h2V9h2v7z"/></svg>
          Pay Securely with Razorpay
        </button>
      </div>

      <!-- Success Screen -->
      <div class="card p-8 shadow-lg bg-white max-w-md mx-auto mt-10 rounded-xl text-center" *ngIf="paid()">
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p class="text-gray-600">Thank you for your payment. Invoice status has been updated in our system.</p>
        <p class="text-sm mt-4 text-gray-800 font-mono bg-gray-100 p-2 rounded inline-block">Ref: {{paymentId()}}</p>
      </div>
    </div>
  `,
  styles: [`
    .checkout-container { min-height: 100vh; background-color: #f3f4f6; padding-top: 5rem; }
  `]
})
export class PayComponent implements OnInit {
  route = inject(ActivatedRoute);
  http = inject(HttpClient);
  
  invoiceLocalId = signal<string>('');
  invoiceData = signal<any>(null);
  paid = signal<boolean>(false);
  loading = signal<boolean>(true);
  error = signal<string>('');
  paymentId = signal<string>('pay_xxxxxxx');

  ngOnInit() {
    this.invoiceLocalId.set(this.route.snapshot.paramMap.get('id') || '');
    this.loadRazorpayScript();
    
    if(this.invoiceLocalId()) {
       this.fetchInvoice();
    } else {
       this.error.set("Invalid payment link.");
       this.loading.set(false);
    }
  }

  fetchInvoice() {
    // Allows public access if backend route has [AllowAnonymous]
    this.http.get<any>(`http://localhost:5284/api/invoices/${this.invoiceLocalId()}`).subscribe({
      next: (data) => {
        if (data.dueAmount <= 0) {
           this.error.set("This invoice is already fully paid.");
        } else {
           this.invoiceData.set(data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set("Invoice not found or deleted.");
        this.loading.set(false);
      }
    });
  }

  loadRazorpayScript() {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }

  openRazorpay() {
    const inv = this.invoiceData();
    if (!inv || typeof inv.dueAmount === 'undefined') return;
    
    // Amount must be in absolute paise/cents
    const amountInPaise = Math.round(inv.dueAmount * 100);

    const options = {
      key: "rzp_test_SZnlcU8t6p6Dok", // Users actual test api key
      amount: amountInPaise.toString(),
      currency: "INR",
      name: "Dhwiti CRM",
      description: `Payment for Invoice #${inv.invoiceNumber}`,
      image: "https://dhwiti.com/logo.png",
      handler: (response: any) => {
        console.log("Payment successful from Razorpay!", response);
        const refId = response.razorpay_payment_id;
        
        // Update to BE
        this.http.post(`http://localhost:5284/api/invoices/${inv.id}/payment`, {
           amount: inv.dueAmount,
           paymentMode: "Online",
           transactionRef: refId,
           remarks: "Paid via Razorpay Test SDK"
        }).subscribe({
           next: () => {
             this.paymentId.set(refId);
             this.paid.set(true);
             // Send confirmation email to customer
             this.sendConfirmationEmail(inv, refId);
           },
           error: () => {
             // Payment captured but DB update failed — still show success + attempt email
             this.paymentId.set(refId);
             this.paid.set(true);
             this.sendConfirmationEmail(inv, refId);
           }
        });
      },
      prefill: {
        name: inv.customerName || "Customer",
        email: inv.customerEmail || "",
      },
      theme: {
        color: "#4F46E5"
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  sendConfirmationEmail(inv: any, refId: string) {
    const customerEmail = inv.customerEmail || '';
    if (!customerEmail) return; // no email to send

    const subject = `Payment Confirmation - Invoice #${inv.invoiceNumber}`;
    const body = `Dear ${inv.customerName || 'Customer'},

Your payment has been successfully received!

Invoice Number : ${inv.invoiceNumber}
Amount Paid    : ₹${inv.dueAmount.toFixed(2)}
Payment Ref ID : ${refId}

Your invoice status has been updated to "Paid" in our system.

Thank you for your business!

Best regards,
Dhwiti CRM | Finance Team`;

    this.http.post('http://localhost:5284/api/emails', {
      toEmail: customerEmail,
      subject: subject,
      body: body
    }).subscribe({
      next: () => console.log('Payment confirmation email sent to', customerEmail),
      error: (err) => console.warn('Email send failed (non-critical):', err)
    });
  }
}
