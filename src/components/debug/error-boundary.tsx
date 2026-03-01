"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCcw, Database } from "lucide-react";
import { resetDatabase } from "@/lib/db";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = async () => {
        if (confirm("This will clear all local data and reset the app. Are you sure?")) {
            await resetDatabase();
            window.location.href = "/";
        }
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <div className="max-w-md w-full glass-card border-destructive/20 p-8 rounded-2xl space-y-6 text-center shadow-2xl shadow-destructive/10">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                            <ShieldAlert className="w-10 h-10 text-destructive" />
                        </div>

                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            JwelFlow encountered an unexpected error. This might be due to a corrupted database or a system conflict.
                        </p>

                        <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3 text-left overflow-auto max-h-32">
                            <code className="text-[10px] text-destructive block font-mono">
                                {this.state.error?.name}: {this.state.error?.message}
                            </code>
                        </div>

                        <div className="pt-4 grid grid-cols-1 gap-3">
                            <Button onClick={this.handleReload} className="w-full">
                                <RefreshCcw className="w-4 h-4 mr-2" /> Reload Application
                            </Button>
                            <Button onClick={this.handleReset} variant="outline" className="w-full border-destructive/20 text-destructive hover:bg-destructive/5">
                                <Database className="w-4 h-4 mr-2" /> Emergency Data Reset
                            </Button>
                        </div>

                        <p className="text-[10px] text-muted-foreground pt-4">
                            If the error persists, please share the code above with support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
